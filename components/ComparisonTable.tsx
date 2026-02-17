
import { Check, X } from 'lucide-react';

export default function ComparisonTable() {
    return (
        <section className="py-24 bg-[#F2F2F7]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-slate-900">Versus</h2>
                </div>

                <div className="bg-white rounded-[1.5rem] shadow-sm overflow-hidden divide-y divide-slate-100">
                    {/* Header */}
                    <div className="grid grid-cols-3 p-4 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                        <div>Feature</div>
                        <div className="text-[#007AFF]">Aporto</div>
                        <div>Agencies</div>
                    </div>

                    {/* Rows */}
                    <div className="grid grid-cols-3 p-5 items-center hover:bg-slate-50 transition-colors">
                        <div className="font-semibold text-slate-900 text-sm">Cost</div>
                        <div className="text-center font-bold text-[#007AFF] text-lg"><span className="text-xs font-normal text-slate-400 block">starts at</span>$49</div>
                        <div className="text-center text-slate-500 text-sm">$1,500+</div>
                    </div>

                    <div className="grid grid-cols-3 p-5 items-center hover:bg-slate-50 transition-colors">
                        <div className="font-semibold text-slate-900 text-sm">Speed</div>
                        <div className="text-center font-bold text-emerald-500 text-sm bg-emerald-50 py-1 px-2 rounded-full mx-auto w-fit">Instant</div>
                        <div className="text-center text-slate-500 text-sm">2 weeks</div>
                    </div>

                    <div className="grid grid-cols-3 p-5 items-center hover:bg-slate-50 transition-colors">
                        <div className="font-semibold text-slate-900 text-sm">Method</div>
                        <div className="text-center text-xs font-medium text-slate-900">AI Legal Code</div>
                        <div className="text-center text-xs text-slate-500">Manual</div>
                    </div>

                    <div className="grid grid-cols-3 p-5 items-center hover:bg-slate-50 transition-colors">
                        <div className="font-semibold text-slate-900 text-sm">Guarantee</div>
                        <div className="flex justify-center"><Check className="w-5 h-5 text-[#007AFF]" /></div>
                        <div className="flex justify-center"><X className="w-5 h-5 text-slate-300" /></div>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    Agencies charge monthly retainers. We charge per successful logic generation.
                </p>
            </div>
        </section>
    );
}
