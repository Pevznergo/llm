
'use client';

import { Scan, Zap, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-[#F2F2F7]"> {/* iOS System Gray 6 */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-4">
                        The Process.
                    </h2>
                    <p className="text-slate-500 text-lg font-medium">
                        AI-driven legal defense, simplified.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">

                    {/* Card 1: The Audit (iOS Small Widget) */}
                    <div className="col-span-1 md:col-span-1 bg-white rounded-[2rem] p-8 flex flex-col items-start shadow-sm hover:scale-[1.02] transition-transform duration-300">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                            <Scan className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Policy Scan</h3>
                        <p className="text-slate-500 leading-relaxed mb-6 text-[15px]">
                            Instant check against 20+ violation types.
                        </p>
                        <div className="mt-auto space-y-2 w-full">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Detected
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-3/4 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Stage 1 (iOS Medium Widget) */}
                    <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-[#5856D6] to-[#4A48C8] rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8 text-white relative overflow-hidden shadow-xl shadow-indigo-500/20 hover:scale-[1.01] transition-transform">
                        {/* Glass effect implementation */}
                        <div className="relative z-10 flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold tracking-widest uppercase text-indigo-200">Stage 1</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Instant Appeal</h3>
                            <p className="text-indigo-100 leading-relaxed max-w-lg font-medium">
                                We submit a drafted legal report directly to moderators.
                            </p>
                        </div>

                        <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-[1.5rem] p-5 border border-white/20 w-full md:w-64">
                            <div className="text-[10px] font-mono text-white/90 leading-relaxed">
                                "Violation: Google Policy 4.2<br />Content: Conflict of Interest<br />Action: Remove"
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Stage 2 (iOS Large Widget) */}
                    <div className="col-span-1 md:col-span-3 bg-white rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm hover:scale-[1.01] transition-transform">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-500/20">
                                    <FileText className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <span className="text-xs font-bold tracking-widest uppercase text-slate-400">Stage 2</span>
                                    <h3 className="text-2xl font-bold text-slate-900">Legal Demand Letter</h3>
                                </div>
                            </div>
                            <p className="text-slate-600 leading-relaxed max-w-2xl font-medium">
                                Automatic escalation to legal departments if the appeal is ignored.
                            </p>
                        </div>

                        <button className="flex-shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold px-6 py-3 rounded-full transition-colors text-sm">
                            View Sample PDF
                        </button>
                    </div>

                </div>
            </div>
        </section>
    );
}
