'use client'

import { Code2, Zap, Search } from 'lucide-react'

export default function Catalog() {
    const categories = [
        {
            title: "AI Engineering & Coding",
            icon: <Code2 className="w-6 h-6 text-blue-400" />,
            tools: [
                { name: "Bolt.new Pro", desc: "Build full-stack apps with one prompt." },
                { name: "Replit Core", desc: "The most powerful browser IDE." },
                { name: "Lovable", desc: "Generate UI/UX code instantly." }
            ],
            benefit: "Save on monthly seats."
        },
        {
            title: "Automation & Ops",
            icon: <Zap className="w-6 h-6 text-purple-400" />,
            tools: [
                { name: "n8n Cloud", desc: "Advanced workflow automation." },
                { name: "Linear", desc: "Issue tracking built for speed." },
                { name: "Make", desc: "Connect apps visually." }
            ],
            benefit: "Enterprise-grade tools at startup prices."
        },
        {
            title: "Research & Productivity",
            icon: <Search className="w-6 h-6 text-green-400" />,
            tools: [
                { name: "Perplexity Pro", desc: "AI-powered research assistant." },
                { name: "Superhuman", desc: "The fastest email experience ever made." },
                { name: "Raycast", desc: "The productivity launcher." }
            ],
            benefit: "Cut down research time by 50%."
        }
    ]

    return (
        <section id="catalog" className="py-24 px-6 bg-white/5 backdrop-blur-lg rounded-[3rem] mx-4 mb-20 border border-white/10">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl sm:text-5xl font-black text-center mb-16 tracking-tight text-white">
                    Curated Deals for <span className="text-gray-500">Modern Builders</span>
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                    {categories.map((cat, i) => (
                        <div key={i} className="p-8 rounded-3xl bg-black/40 border border-white/5 hover:border-white/20 transition-all">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                    {cat.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white">{cat.title}</h3>
                            </div>

                            <div className="space-y-6 mb-8">
                                {cat.tools.map((tool, j) => (
                                    <div key={j} className="group">
                                        <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{tool.name}</div>
                                        <div className="text-sm text-gray-500">{tool.desc}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-white/10">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Benefit</div>
                                <div className="text-sm font-medium text-gray-300">{cat.benefit}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
