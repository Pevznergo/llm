import { checkAdmin } from "@/app/actions/admin";
import ModelCostsClient from "@/components/ModelCostsClient";

export const metadata = {
    title: 'Model Costs Management | Admin',
    description: 'Manage custom token costs per model for Key Usage analytics.',
};

export default async function ModelCostsPage() {
    await checkAdmin();

    return (
        <div className="min-h-screen bg-gray-50/50">
            <ModelCostsClient />
        </div>
    );
}
