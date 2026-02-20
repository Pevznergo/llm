import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AddCredentialsClient from "@/components/AddCredentialsClient";

const ADMIN_EMAIL = "pevznergo@gmail.com";

export default async function AddCredentialsPage() {
    const session = await getServerSession(authOptions);

    // Strict admin check (Server Validation)
    if (!session || !session.user || session.user.email !== ADMIN_EMAIL) {
        return redirect("/"); // Or 404
    }

    return <AddCredentialsClient />;
}
