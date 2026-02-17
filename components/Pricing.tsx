
import { Check, ArrowRight, ShieldAlert, Mail } from 'lucide-react';

export default function Pricing() {
    return (
        <section id="pricing" className="py-24 bg-[#F2F2F7]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto items-stretch">

                    {/* Card 1: Online Appeal ($49) */}
                    <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 p-2 overflow-hidden relative">
                        <div className="bg-slate-50 h-full rounded-[2rem] p-8 pt-10 text-center border border-slate-100 relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>

                            <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-widest mb-2">Platform Appeal</h3>
                            <div className="flex items-baseline justify-center gap-0.5 mb-8">
                                <span className="text-5xl font-bold text-slate-900 tracking-tighter">$49</span>
                                <span className="text-slate-400 text-sm font-medium">/one-time</span>
                            </div>

                            <ul className="space-y-4 text-left mb-8 flex-1">
                                <li className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3.5 h-3.5 text-[#007AFF]" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">Instant Policy Scan</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3.5 h-3.5 text-[#007AFF]" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">AI Legal Argument Generation</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3.5 h-3.5 text-[#007AFF]" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">Direct Submission Guide</span>
                                </li>
                            </ul>

                            <button className="w-full bg-[#007AFF] hover:bg-[#006ee6] text-white font-semibold py-4 rounded-[1.2rem] shadow-lg shadow-blue-500/30 transition-transform active:scale-[0.98] flex items-center justify-center gap-2">
                                Start Removal
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Card 2: Cease & Desist (Custom) */}
                    <div className="flex-1 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl shadow-slate-900/20 p-2 overflow-hidden relative">
                        <div className="bg-slate-800/50 backdrop-blur-sm h-full rounded-[2rem] p-8 pt-10 text-center border border-slate-700 relative overflow-hidden flex flex-col">

                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <ShieldAlert className="w-32 h-32" />
                            </div>

                            <h3 className="text-indigo-400 font-semibold text-sm uppercase tracking-widest mb-2">Legal Escalation</h3>
                            <div className="flex items-baseline justify-center gap-0.5 mb-8">
                                <span className="text-4xl font-bold text-white tracking-tighter">Custom</span>
                            </div>

                            <ul className="space-y-4 text-left mb-8 flex-1">
                                <li className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3.5 h-3.5 text-indigo-400" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-300">Formal Cease & Desist Letter</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3.5 h-3.5 text-indigo-400" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-300">Sent via Certified Mail</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3.5 h-3.5 text-indigo-400" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-300">Defamation Case Assessment</span>
                                </li>
                            </ul>

                            <button className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-4 rounded-[1.2rem] shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2">
                                Contact Sales
                                <Mail className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                </div>

                <p className="text-center text-xs text-slate-400 mt-8 font-medium max-w-2xl mx-auto leading-relaxed">
                    * Funds are only reserved during the active order period. You do not pay if the review is not removed. <br />
                    Legal Escalation (Stage 2) is an optional add-on service, paid separately upon mutual agreement.
                </p>
            </div>
        </section>
    );
}
