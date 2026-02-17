"use client"

import { useState } from "react"
import { Check, Copy, Terminal } from "lucide-react"

export function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-black transition-colors"
            title="Copy ID"
        >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </button>
    )
}

export function IntegrationSnippet({ modelId, apiKey }: { modelId: string, apiKey: string }) {
    const [lang, setLang] = useState<"curl" | "python" | "js">("curl")

    const snippets = {
        curl: `curl https://api.aporto.tech/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "${modelId}",
    "messages": [
      { "role": "user", "content": "Hello!" }
    ]
  }'`,
        python: `import openai

client = openai.OpenAI(
    api_key="${apiKey}",
    base_url="https://api.aporto.tech"
)

response = client.chat.completions.create(
    model="${modelId}",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`,
        js: `import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '${apiKey}',
  baseURL: 'https://api.aporto.tech'
});

const response = await openai.chat.completions.create({
  model: '${modelId}',
  messages: [{ role: 'user', content: 'Hello!' }],
});
console.log(response.choices[0].message.content);`
    }

    return (
        <div className="bg-gray-900 rounded-lg overflow-hidden text-gray-100 text-sm font-mono mt-4">
            <div className="flex bg-gray-800 p-2 gap-2">
                {(Object.keys(snippets) as Array<keyof typeof snippets>).map((l) => (
                    <button
                        key={l}
                        onClick={() => setLang(l)}
                        className={`px-3 py-1 rounded ${lang === l ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        {l.toUpperCase()}
                    </button>
                ))}
            </div>
            <div className="p-4 relative group">
                <pre className="overflow-x-auto whitespace-pre-wrap">
                    {snippets[lang]}
                </pre>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(snippets[lang])
                        }}
                        className="bg-gray-700 p-2 rounded hover:bg-gray-600"
                    >
                        <Copy className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
