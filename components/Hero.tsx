'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Image as ImageIcon, Sparkles, Send, Bot, Check } from 'lucide-react';

export default function Hero() {
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string | React.ReactNode }>>([
        { role: 'assistant', content: 'Привет! Я подключен к GPT-4o и Claude 3.5. Какой вопрос решим сегодня?' }
    ]);
    const [activeModel, setActiveModel] = useState("GPT-4o");

    // Auto-scroll logic
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-[#F2F2F7]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* Left Column: Selling Text */}
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100/50 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-wide mb-6">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span>Доступно в РФ без VPN</span>
                            </div>

                            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
                                Бесплатный доступ к <br />
                                <span className="text-[#007AFF]">ChatGPT 4o</span> и <span className="text-[#5856D6]">Claude 3.5</span>
                            </h1>

                            <p className="text-lg text-slate-500 mb-8 leading-relaxed font-medium">
                                Пользуйтесь лучшими нейросетями мира без зарубежных карт и регистрации на иностранных сайтах. Работает прямо в Telegram.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-10">
                                <a
                                    href="https://t.me/Aporto_bot"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-[#007AFF] hover:bg-[#006ee6] border border-transparent rounded-full shadow-lg hover:shadow-blue-500/30 active:scale-95"
                                >
                                    Открыть в Telegram
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </a>
                                <div className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500 bg-white/50 rounded-full border border-slate-200/50">
                                    <Bot className="w-4 h-4 text-slate-400" />
                                    <span>Не нужно скачивать приложение</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>GPT-4 Omni</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>Claude 3.5 Sonnet</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>DALL-E 3</span>
                                </div>
                            </div>

                        </motion.div>
                    </div>

                    {/* Right Column: Chat Demo with Model Selector */}
                    <div className="relative w-full perspective-1000">
                        {/* Glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 blur-3xl rounded-full opacity-60 pointer-events-none transform scale-110" />

                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", damping: 20, stiffness: 100 }}
                            className="relative bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/40 overflow-hidden min-h-[500px] flex flex-col"
                        >
                            {/* Header / Model Selector */}
                            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-white/50 backdrop-blur-md z-20">
                                <div className="flex gap-2 w-full overflow-x-auto no-scrollbar scroll-smooth p-1">
                                    {['GPT-4o', 'Claude 3.5', 'Midjourney'].map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setActiveModel(m)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeModel === m
                                                    ? 'bg-slate-900 text-white shadow-md'
                                                    : 'bg-white text-slate-500 hover:bg-slate-100'
                                                }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50">
                                <div className="flex justify-start">
                                    <div className="bg-white text-slate-800 rounded-2xl rounded-tl-none border border-slate-100 px-4 py-3 shadow-sm max-w-[85%] text-sm leading-relaxed">
                                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            <Sparkles className="w-3 h-3 text-blue-500" />
                                            Aporto AI ({activeModel})
                                        </div>
                                        Привет! Я готов к работе. Могу написать код, проанализировать документ или просто поболтать. Лимиты обновлены! 🚀
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <div className="bg-[#007AFF] text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-sm max-w-[85%] text-sm leading-relaxed font-medium">
                                        Расскажи, чем Claude 3.5 лучше чем GPT-4 для программирования?
                                    </div>
                                </div>

                                <div className="flex justify-start">
                                    <div className="bg-white text-slate-800 rounded-2xl rounded-tl-none border border-slate-100 px-4 py-3 shadow-sm max-w-[90%] text-sm leading-relaxed">
                                        Claude 3.5 Sonnet часто показывает себя лучше в написании кода благодаря:
                                        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
                                            <li>Более актуальным знаниям библиотек.</li>
                                            <li>меньшему количеству "галлюцинаций".</li>
                                            <li>Способности лучше удерживать контекст больших файлов.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-slate-100">
                                <div className="bg-slate-100 rounded-[1.5rem] px-4 py-3 flex items-center gap-3 opacity-60 pointer-events-none">
                                    <div className="flex-1 text-sm text-slate-400 font-medium">
                                        Напишите сообщение...
                                    </div>
                                    <div className="p-2 bg-[#007AFF] rounded-full text-white">
                                        <Send className="w-4 h-4 translate-x-px translate-y-px" />
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
