import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/app/actions/admin";
import AdminUsersPageClient from "@/components/AdminUsersPage";

const ADMIN_EMAIL = "pevznergo@gmail.com";

export default async function AdminUsersPage() {
    const session = await getServerSession(authOptions);

    // Strict admin check
    if (!session || !session.user || session.user.email !== ADMIN_EMAIL) {
        return redirect("/"); // Or 404
    }

    const { users, error } = await getAllUsers();

    if (error) {
        return <div className="p-8 text-red-600">Error: {error}</div>;
    }

    return <AdminUsersPageClient users={users || []} />;
}
