'use client'

export default function Partners() {
    const partners = [
        "Canva",
        "CapCut",
        "Lovable",
        "n8n",
        "Elevenlabs",
        "Coursera"
    ]

    // Duplicate the list to ensure smooth infinite scrolling
    const scrollingPartners = [...partners, ...partners, ...partners, ...partners]

    return (
        <section className="w-full py-10 border-y border-white/5 bg-white/2 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 text-center">
                <p className="text-sm text-gray-500 font-medium uppercase tracking-widest">Save up to 35% on</p>
            </div>

            <div className="relative flex overflow-x-hidden group">
                <div className="animate-marquee whitespace-nowrap flex items-center gap-16 px-8">
                    {scrollingPartners.map((partner, index) => (
                        <span
                            key={index}
                            className="text-2xl sm:text-3xl font-bold text-gray-500/50 hover:text-white/80 transition-colors cursor-default"
                        >
                            {partner}
                        </span>
                    ))}
                </div>

                {/* Gradient Masks for smooth fade in/out */}
                <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
            </div>
        </section>
    )
}
