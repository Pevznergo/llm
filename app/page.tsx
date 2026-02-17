import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUser, listKeys } from "@/lib/litellm";
import { KeyGenerator } from "@/components/KeyGenerator";
import { SignOutButton } from "@/components/SignOutButton";
import { CreditCard, Activity, Key, LogOut } from "lucide-react";
import Link from 'next/link';

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) return redirect("/api/auth/signin");

  const email = session.user.email;

  // Fetch data in parallel
  const userPromise = getUser(email);
  const keysPromise = listKeys(email);
  const [user, keys] = await Promise.all([userPromise, keysPromise]);

  const spend = user?.spend || 0;
  const budget = user?.max_budget || 0; // Infinity if not set?
  const requestCount = user?.request_count || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* Logo placeholder */}
            <div className="h-8 w-8 bg-black rounded-full"></div>
            <span className="font-semibold text-lg">Client Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/models" className="text-gray-600 hover:text-black">Models</Link>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{email}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold">${spend.toFixed(4)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-full text-green-600">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Requests</p>
                <p className="text-2xl font-bold">{requestCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                <Key className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Keys</p>
                <p className="text-2xl font-bold">{keys.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Keys List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-medium">API Keys</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {keys.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No keys found. Generate one to get started.</div>
                ) : (
                  keys.map((key) => (
                    <div key={key.token || key.key} className="p-4 flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-sm">{key.key_alias || "Unnamed Key"}</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">
                          {key.key ? key.key.substring(0, 10) + "..." : "sk-..." + (key.token?.substring(0, 8) || "")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Spent: ${key.spend?.toFixed(4) || "0.0000"}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Generate Key */}
          <div className="space-y-6">
            <KeyGenerator />
          </div>
        </div>
      </main>
    </div>
  );
}
