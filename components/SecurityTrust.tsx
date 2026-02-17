
import { ShieldCheck, Lock, EyeOff } from 'lucide-react';

export default function SecurityTrust() {
    return (
        <section className="py-20 bg-white border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
                            We never sell your data. We only fight for you.
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-300">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-primary-hover mb-2">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-white">Bank-Level Security</h3>
                                <p className="text-sm">256-bit encryption protects all your documents and personal info.</p>
                            </div>

                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-primary-hover mb-2">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-white">Stripe Secure Payment</h3>
                                <p className="text-sm">We don't store card details. Payments are processed securely via Stripe.</p>
                            </div>

                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-primary-hover mb-2">
                                    <EyeOff className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-white">Data Privacy Promise</h3>
                                <p className="text-sm">Your data is yours. We delete it upon request and never share with 3rd parties.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
