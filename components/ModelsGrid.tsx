'use client';

import { motion } from 'framer-motion';
import { Sparkles, Code2, Image as ImageIcon, Zap, Bot, BrainCircuit, CreditCard, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const models = [
    {
        name: "GPT-4o",
        description: "Флагман от OpenAI. Идеален для диалогов, анализа и креатива.",
        icon: Sparkles,
        color: "from-green-400 to-emerald-600",
        badge: "Хит"
    },
    {
        name: "Claude 3.5 Sonnet",
        description: "Лучшая модель для написания кода и работы с большими текстами.",
        icon: Code2,
        color: "from-orange-400 to-red-500",
        badge: "Для профи"
    },
    {
        name: "DALL-E 3",
        description: "Создавайте потрясающие изображения по текстовому описанию.",
        icon: ImageIcon,
        color: "from-purple-400 to-indigo-500",
    },
    {
        name: "Midjourney v6",
        description: "Фотореалистичные арты высочайшего качества (Скоро).",
        icon: Zap,
        color: "from-blue-400 to-cyan-500",
        disabled: true
    }
];

export default function ModelsGrid() {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                        Все топовые нейросети <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#007AFF] to-[#5856D6]">в одном окне</span>
                    </h2>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Забудьте о VPN, зарубежных сим-картах и сложных оплатах. Мы собрали лидеров рынка и сделали их доступными для вас.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {models.map((model, idx) => (
                        <motion.div
                            key={model.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={cn(
                                "relative p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group",
                                model.disabled && "opacity-70 grayscale-[0.5]"
                            )}
                        >
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg bg-gradient-to-br",
                                model.color
                            )}>
                                <model.icon className="w-7 h-7" />
                            </div>

                            {model.badge && (
                                <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-white shadow-sm text-[10px] font-bold uppercase tracking-wider text-slate-900 border border-slate-100">
                                    {model.badge}
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-slate-900 mb-2">{model.name}</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                {model.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Benefits Mini-Grid */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-100 pt-16">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#007AFF]">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">Без VPN</h4>
                            <p className="text-sm text-slate-500">Работает из РФ стабильно и быстро.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#007AFF]">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">Оплата рублями</h4>
                            <p className="text-sm text-slate-500">Карты российских банков и СБП.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#007AFF]">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">Telegram Bot</h4>
                            <p className="text-sm text-slate-500">Не нужно скачивать лишние приложения.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
