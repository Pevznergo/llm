import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import { sql } from "@/lib/db";

// Helper function to sleep
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }
    const adminEmails = ["pevznergo@gmail.com", "igordash1@gmail.com"];
    if (!adminEmails.includes(session.user.email)) {
        return new NextResponse("Forbidden: Admin access only", { status: 403 });
    }

    try {
        const { serviceAccountJson, proxyUrl, quantity } = await req.json();

        if (!serviceAccountJson) {
            return new NextResponse("Service Account JSON is required.", { status: 400 });
        }

        const count = parseInt(quantity) || 10;
        if (count < 1 || count > 50) {
            return new NextResponse("Quantity must be between 1 and 50.", { status: 400 });
        }

        let parsedCredentials;
        try {
            parsedCredentials = JSON.parse(serviceAccountJson);
        } catch (e) {
            return new NextResponse("Invalid Service Account JSON format.", { status: 400 });
        }

        // Set up Server-Sent Events stream
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const sendEvent = (data: any) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                try {
                    sendEvent({ type: "info", message: "Starting GCP automation sequence..." });

                    // 1. Configure the proxy agent if provided
                    let clientOptions: any = {};
                    if (proxyUrl) {
                        if (proxyUrl.startsWith("socks")) {
                            clientOptions.agent = new SocksProxyAgent(proxyUrl);
                            sendEvent({ type: "info", message: "Configured SOCKS5 proxy." });
                        } else {
                            clientOptions.agent = new HttpsProxyAgent(proxyUrl);
                            sendEvent({ type: "info", message: "Configured HTTP proxy." });
                        }
                    }

                    // 2. Initialize Google Auth Client
                    sendEvent({ type: "info", message: "Authenticating with Service Account..." });
                    const auth = new google.auth.GoogleAuth({
                        credentials: parsedCredentials,
                        scopes: [
                            'https://www.googleapis.com/auth/cloud-platform',
                            'https://www.googleapis.com/auth/service.management'
                        ],
                        clientOptions: clientOptions
                    });

                    // 3. Get the default Billing Account
                    sendEvent({ type: "info", message: "Fetching Billing Accounts..." });
                    const billing = google.cloudbilling({ version: "v1", auth });
                    const billingRes = await billing.billingAccounts.list();
                    const billingAccounts = billingRes.data.billingAccounts;

                    if (!billingAccounts || billingAccounts.length === 0) {
                        throw new Error("No active billing account found on this Service Account.");
                    }
                    const billingName = billingAccounts[0].name!;
                    sendEvent({ type: "info", message: `Found Root Billing Account: ${billingName}` });

                    // Initialize Service Clients
                    const resourceManager = google.cloudresourcemanager({ version: "v1", auth });
                    const serviceUsage = google.serviceusage({ version: "v1", auth });
                    const apiKeysClient = google.apikeys({ version: "v2", auth });

                    let successfulKeys = 0;

                    for (let i = 1; i <= count; i++) {
                        // Generate a unique project ID
                        const shortId = Math.random().toString(36).substring(2, 8);
                        const projectId = `gemini-api-${shortId}-${Date.now().toString().slice(-4)}`;

                        sendEvent({ type: "progress", current: i, total: count, message: `[${i}/${count}] Creating Project: ${projectId}` });

                        try {
                            // A. Create Project
                            const createOp = await resourceManager.projects.create({
                                requestBody: {
                                    projectId: projectId,
                                    name: `Gemini Key Gen ${i}`
                                }
                            });

                            // Projects take a few seconds to initialize
                            sendEvent({ type: "info", message: `Waiting for project ${projectId} to initialize...` });
                            await sleep(5000);

                            // B. Link Billing
                            sendEvent({ type: "info", message: `Linking billing account to ${projectId}...` });
                            await billing.projects.updateBillingInfo({
                                name: `projects/${projectId}`,
                                requestBody: { billingAccountName: billingName }
                            });
                            await sleep(2000);

                            // C. Enable Required Services
                            sendEvent({ type: "info", message: `Enabling AI Studio and API Key Services...` });
                            await serviceUsage.services.batchEnable({
                                parent: `projects/${projectId}`,
                                requestBody: {
                                    serviceIds: [
                                        "generativelanguage.googleapis.com",
                                        "apikeys.googleapis.com"
                                    ]
                                }
                            });

                            // APIs take time to fully propagate before a key can be created
                            sendEvent({ type: "info", message: `Waiting 10 seconds for API propagation...` });
                            await sleep(10000);

                            // D. Generate API Key
                            sendEvent({ type: "info", message: `Generating API Key...` });
                            const keyOp = await apiKeysClient.projects.locations.keys.create({
                                parent: `projects/${projectId}/locations/global`,
                                requestBody: {
                                    displayName: `Auto-Generated-Key-${shortId}`
                                }
                            });

                            const generatedKey = keyOp.data.keyString;

                            if (generatedKey) {
                                // E. Save to Database
                                await sql`
                                    INSERT INTO gcp_api_keys (project_id, api_key, status)
                                    VALUES (${projectId}, ${generatedKey}, 'active')
                                `;
                                successfulKeys++;
                                sendEvent({ type: "success", message: `Successfully saved API Key for ${projectId}` });
                            } else {
                                throw new Error("Key generation succeeded but keyString was null.");
                            }

                        } catch (err: any) {
                            sendEvent({ type: "error", message: `Failed on [${i}/${count}] ${projectId}: ${err.message}` });
                            // Continue to next project instead of failing entire sequence
                        }
                    }

                    sendEvent({ type: "done", message: `Completed! Successfully generated ${successfulKeys} out of ${count} API keys.` });
                    controller.close();
                } catch (error: any) {
                    sendEvent({ type: "error", message: `Fatal Error: ${error.message}` });
                    controller.close();
                }
            }
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
            },
        });

    } catch (e: any) {
        return new NextResponse(`Internal Server Error: ${e.message}`, { status: 500 });
    }
}
