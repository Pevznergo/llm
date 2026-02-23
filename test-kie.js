const apiUrl = "https://api.kie.ai/gemini-2.5-pro/v1/chat/completions";
// We don't have the user's real key, so we'll use a dummy. If it's a Rate Limit
// before auth, or an Auth error, we'll see exactly what Kie.ai spits back.
const apiKey = "sk-placeholder";

async function testKie() {
    console.log(`Sending POST to ${apiUrl}...`);
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gemini-2.5-pro",
                messages: [{ role: "user", content: "Hello, testing connection." }]
            })
        });

        const status = response.status;
        const text = await response.text();

        console.log(`\nHTTP ${status}`);
        console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
        console.log(`\nResponse Body:\n${text}`);

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testKie();
