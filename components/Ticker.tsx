'use client'

export default function Ticker() {
    const logos = [
        'n8n', 'Bolt', 'Replit', 'Perplexity', 'Lovable', 'Linear', 'Superhuman', 'Make'
    ]

    return (
        <section className="py-12 border-y border-white/5 bg-white/5 backdrop-blur-sm overflow-hidden">
            <div className="text-center mb-8">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Access Exclusive Deals For</p>
            </div>

            <div className="relative flex overflow-x-hidden group mask-linear-fade">
                <div className="animate-marquee whitespace-nowrap flex items-center gap-16 py-4">
                    {/* Repeat logos enough times to ensure smooth infinite scroll */}
                    {[...logos, ...logos, ...logos, ...logos].map((logo, i) => (
                        <span key={i} className="text-2xl font-bold text-gray-500/50 hover:text-white/80 transition-colors cursor-default">
                            {logo}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    )
}
