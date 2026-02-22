import { checkAdmin } from "@/app/actions/admin";
import ModelLimitsClient from "@/components/ModelLimitsClient";

export const metadata = {
    title: 'Daily Model Limits | Admin',
    description: 'Monitor actual model consumption versus the configured daily limits (RLD).',
};

export default async function ModelLimitsPage() {
    await checkAdmin();

    return (
        <div className="min-h-screen bg-gray-50/50">
            <ModelLimitsClient />
        </div>
    );
}
