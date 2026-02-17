'use client'

import { Gem, Lock, TrendingUp } from 'lucide-react'

export default function ValueProp() {
    const benefits = [
        {
            title: "Instant Value Add",
            desc: "The savings your members get on software can often cover the cost of your community subscription. It makes joining a \"no-brainer.\"",
            icon: <Gem className="w-8 h-8 text-blue-400" />
        },
        {
            title: "Higher Retention",
            desc: "Members stay longer because they don't want to lose access to their exclusive tool discounts.",
            icon: <Lock className="w-8 h-8 text-purple-400" />
        },
        {
            title: "Better Student Results",
            desc: "When tools are affordable, students stop hesitating and start building. More building = more success stories for you.",
            icon: <TrendingUp className="w-8 h-8 text-green-400" />
        }
    ]

    return (
        <section id="value-prop" className="py-24 px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight text-white">
                        Make Your Membership <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Irresistible</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto font-medium">
                        Why successful community leaders partner with Aporto:
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {benefits.map((item, i) => (
                        <div key={i} className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all duration-300">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 shadow-md">
                                {item.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-white">{item.title}</h3>
                            <p className="text-gray-400 leading-relaxed font-medium">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
