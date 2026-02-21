import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import GcpGeneratorClient from "@/components/admin/GcpGeneratorClient";

export const metadata = {
    title: "GCP API Factory | Aporto",
    description: "Automate Google Cloud API Key Generation",
};

export default async function GcpGeneratorPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/login");
    }

    const adminEmails = ["pevznergo@gmail.com", "igordash1@gmail.com"];

    if (!session.user.email || !adminEmails.includes(session.user.email)) {
        redirect("/dashboard");
    }

    return <GcpGeneratorClient />;
}
