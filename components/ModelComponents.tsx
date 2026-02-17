"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            title="Copy to clipboard"
        >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </button>
    );
}

export function IntegrationSnippet({ modelId, apiKey }: { modelId: string, apiKey: string }) {
    const snippet = `
import openai

client = openai.OpenAI(
    api_key="${apiKey}",
    base_url="https://aporto.tech/api/litellm" 
)

response = client.chat.completions.create(
    model="${modelId}",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)
`.trim();

    return (
        <div className="relative bg-gray-900 rounded-md p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            <div className="absolute top-2 right-2">
                <CopyButton text={snippet} />
            </div>
            <pre className="whitespace-pre-wrap">{snippet}</pre>
        </div>
    );
}
