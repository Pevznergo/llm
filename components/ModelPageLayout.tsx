import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowRight, Check, Zap } from 'lucide-react';
import { ReactNode } from 'react';

interface ModelPageProps {
    title: string;
    subtitle: string;
    description: string;
    features: string[];
    gradient: string;
    icon: ReactNode;
}

export default function ModelPageLayout({ title, subtitle, description, features, gradient, icon }: ModelPageProps) {
    return (
        <main className="min-h-screen bg-[#F2F2F7]">
            <Header />

            {/* Hero */}
            <section className="pt-40 pb-20 overflow-hidden relative">
                <div className="absolute inset-0 bg-slate-50 border-b border-slate-200"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r ${gradient} text-white mb-8 shadow-lg`}>
                            {icon}
                            <span className="font-bold text-sm">Бесплатный доступ</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
                            {title}
                        </h1>
                        <p className="text-xl text-slate-500 font-medium mb-10 max-w-xl leading-relaxed">
                            {subtitle}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href="https://t.me/Aporto_bot" target="_blank" className="flex items-center justify-center px-8 py-4 bg-[#007AFF] text-white font-bold rounded-full hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30">
                                Запустить в Telegram <ArrowRight className="ml-2 w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Возможности {title}</h3>
                        <ul className="space-y-4">
                            {features.map((feat, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <div className={`mt-1 w-5 h-5 rounded-full bg-gradient-to-r ${gradient} flex items-center justify-center flex-shrink-0`}>
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="text-slate-600 font-medium leading-tight">{feat}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Description Body matching reference style */}
            <section className="py-24 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">Описание нейросети {title}</h2>
                    <p className="text-lg text-slate-500 leading-relaxed mb-8">
                        {description}
                    </p>

                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Почему стоит использовать Aporto для доступа к {title}?</h3>
                        <ul className="grid gap-4 md:grid-cols-2">
                            <li className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                <span className="font-medium text-slate-700">Без VPN и смены IP</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                <span className="font-medium text-slate-700">Оплата картами РФ (для PRO)</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                <span className="font-medium text-slate-700">Русский язык интерфейса</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                <span className="font-medium text-slate-700">История диалогов</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
