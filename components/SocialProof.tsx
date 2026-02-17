
export default function SocialProof() {
    const companies = [
        { name: "TechDaily", logo: "https://via.placeholder.com/120x40/000000/FFFFFF?text=TechDaily" },
        { name: "The Hustle", logo: "https://via.placeholder.com/120x40/000000/FFFFFF?text=The+Hustle" },
        { name: "Business Insider", logo: "https://via.placeholder.com/120x40/000000/FFFFFF?text=Business+Insider" },
        { name: "Forbes", logo: "https://via.placeholder.com/120x40/000000/FFFFFF?text=Forbes" },
        { name: "WSJ", logo: "https://via.placeholder.com/120x40/000000/FFFFFF?text=WSJ" },
    ];

    return (
        <section className="py-12 bg-white border-y border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-sm font-medium text-slate-500 mb-8 uppercase tracking-wider">
                    Trusted by 10,000+ users to recover <span className="text-slate-900 font-bold">$2M+</span> in value
                </p>
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                    {/* Replace with actual SVGs or Images in production. Using text placeholders for now styled to look like logos */}
                    <span className="text-xl font-bold font-serif text-slate-800">The New York Times</span>
                    <span className="text-xl font-bold tracking-tighter text-slate-800 italic">The Hustle</span>
                    <span className="text-xl font-extrabold text-slate-800">TechCrunch</span>
                    <span className="text-xl font-bold font-mono text-slate-800">Bloomberg</span>
                    <span className="text-xl font-serif italic font-bold text-slate-800">WIRED</span>
                </div>
            </div>
        </section>
    );
}
