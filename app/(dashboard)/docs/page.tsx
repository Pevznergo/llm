"use client";

import { useState } from "react";
import { Copy, Check, Terminal, Code2, Cpu, Globe, Key as KeyIcon, BookOpen } from "lucide-react";

function CodeBlock({ code, language }: { code: string; language: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group rounded-xl overflow-hidden bg-gray-900 my-4 shadow-xl">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{language}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                    {copied ? (
                        <>
                            <Check className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-green-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm text-gray-300 font-mono leading-relaxed">
                <code>{code}</code>
            </pre>
        </div>
    );
}

export default function DocsPage() {
    const baseUrl = "https://api.aporto.tech"; // Assuming this is the proxy URL based on NEXTAUTH_URL
    const modelExample = "gpt-4o";

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-blue-600 mb-2">
                    <BookOpen className="w-8 h-8" />
                    <span className="text-sm font-bold uppercase tracking-widest">Documentation</span>
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Quickstart Guide</h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                    Get up and running with Aporto.tech in minutes. Our API is fully compatible with OpenAI SDKs, allowing for a seamless transition.
                </p>
            </div>

            {/* Environment Variables */}
            <section className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <Terminal className="w-5 h-5 text-gray-600" />
                    <h2 className="text-xl font-bold text-gray-900">Environment Configuration (.env)</h2>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                    Copy this into your project&apos;s <code>.env</code> file to configure standard SDKs automatically.
                </p>
                <CodeBlock
                    language="bash"
                    code={`OPENAI_API_BASE=${baseUrl}/v1
OPENAI_BASE_URL=${baseUrl}/v1
OPENAI_API_KEY=YOUR_APORTO_KEY`}
                />
            </section>

            {/* Steps Grid */}
            <div className="grid gap-8">
                {/* Step 1 */}
                <section className="relative pl-12">
                    <div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold border-2 border-blue-200">
                        1
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <KeyIcon className="w-5 h-5 text-gray-400" />
                        <h2 className="text-2xl font-bold text-gray-900">Get your API Key</h2>
                    </div>
                    <p className="text-gray-600 mb-4">
                        Navigate to the <a href="/keys" className="text-blue-600 font-semibold hover:underline">API Keys</a> page and create a new key. Keep this key safe; it grants access to your balance.
                    </p>
                </section>

                {/* Step 2 */}
                <section className="relative pl-12">
                    <div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold border-2 border-blue-200">
                        2
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <h2 className="text-2xl font-bold text-gray-900">Configure Base URL</h2>
                    </div>
                    <p className="text-gray-600 mb-4">
                        All requests should be directed to our unified proxy endpoint. Replace the standard OpenAI base URL with ours.
                    </p>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 font-mono text-sm text-gray-700 flex items-center justify-between">
                        <span>{baseUrl}</span>
                        <button
                            onClick={() => navigator.clipboard.writeText(baseUrl)}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Copy
                        </button>
                    </div>
                </section>

                {/* Step 3 */}
                <section className="relative pl-12">
                    <div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold border-2 border-blue-200">
                        3
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <Cpu className="w-5 h-5 text-gray-400" />
                        <h2 className="text-2xl font-bold text-gray-900">Choose a Model</h2>
                    </div>
                    <p className="text-gray-600 mb-4">
                        Browse the <a href="/models" className="text-blue-600 font-semibold hover:underline">Models</a> page to see available providers and prices. Use the &quot;Copy&quot; button to get the exact model ID.
                    </p>
                </section>
            </div>

            {/* Code Examples */}
            <div className="space-y-8 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                    <Terminal className="w-6 h-6 text-gray-400" />
                    <h2 className="text-3xl font-bold text-gray-900">Implementation Examples</h2>
                </div>

                {/* Python */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Code2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Python (OpenAI SDK)</h3>
                    </div>
                    <CodeBlock
                        language="python"
                        code={`from openai import OpenAI

client = OpenAI(
    base_url="${baseUrl}/v1", 
    api_key="YOUR_APORTO_KEY"
)

response = client.chat.completions.create(
    model="${modelExample}",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`}
                    />
                </div>

                {/* Node.js */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <Code2 className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Node.js (OpenAI SDK)</h3>
                    </div>
                    <CodeBlock
                        language="javascript"
                        code={`import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "${baseUrl}/v1",
  apiKey: "YOUR_APORTO_KEY",
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: "Hello!" }],
    model: "${modelExample}",
  });

  console.log(completion.choices[0].message.content);
}

main();`}
                    />
                </div>

                {/* cURL */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Terminal className="w-5 h-5 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">cURL</h3>
                    </div>
                    <CodeBlock
                        language="bash"
                        code={`curl ${baseUrl}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_APORTO_KEY" \\
  -d '{
    "model": "${modelExample}",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
                    />
                </div>

                {/* LangChain */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Code2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">LangChain (Python)</h3>
                    </div>
                    <CodeBlock
                        language="python"
                        code={`from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    openai_api_base="${baseUrl}/v1",
    openai_api_key="YOUR_APORTO_KEY",
    model_name="${modelExample}"
)

print(llm.invoke("Hello!"))`}
                    />
                </div>

                {/* LlamaIndex */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <Code2 className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">LlamaIndex (Python)</h3>
                    </div>
                    <CodeBlock
                        language="python"
                        code={`from llama_index.llms.openai import OpenAI

llm = OpenAI(
    api_base="${baseUrl}/v1",
    api_key="YOUR_APORTO_KEY",
    model="${modelExample}"
)

resp = llm.complete("Hello!")
print(resp)`}
                    />
                </div>
            </div>

            {/* Support */}
            <div className="p-8 bg-blue-600 rounded-2xl shadow-xl text-white relative overflow-hidden group">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2">Need help?</h2>
                    <p className="text-blue-100 mb-6 max-w-lg">
                        Our team is available to help you with integration or custom requirements. Contact us on Telegram for support.
                    </p>
                    <a
                        href="https://t.me/GoPevzner"
                        target="_blank"
                        className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg"
                    >
                        Contact Support
                    </a>
                </div>
                {/* Decorative background circle */}
                <div className="absolute -right-24 -bottom-24 w-64 h-64 bg-blue-500 rounded-full opacity-50 blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
            </div>
        </div>
    );
}
