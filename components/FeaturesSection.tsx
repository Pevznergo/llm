'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, MessageSquare, Mic, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper for bento items
const BentoItem = ({
    className,
    title,
    description,
    icon: Icon,
    delay = 0
}: {
    className?: string,
    title: string,
    description: string,
    icon: any,
    delay?: number
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        className={cn(
            "rounded-[2rem] p-8 flex flex-col relative overflow-hidden group shadow-sm bg-white border border-slate-100 transition-all hover:shadow-lg hover:border-slate-200",
            className
        )}
    >
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 z-10 text-[#007AFF]">
            <Icon className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2 z-10 relative">{title}</h3>
        <p className="text-slate-500 font-medium leading-relaxed z-10 relative">{description}</p>
    </motion.div>
);

export default function FeaturesSection() {
    return (
        <section id="features" className="py-24 bg-[#F2F2F7]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Feature 1: The Main Pain Point (VPN) */}
                    <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl">
                        <div className="flex-1 relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wide mb-6">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Безопасно и Анонимно</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">Забудьте о VPN и сложных регистрациях.</h2>
                            <p className="text-slate-300 text-lg leading-relaxed max-w-xl">
                                Мы берем на себя все технические сложности. Вы просто открываете Telegram и начинаете пользоваться лучшими нейросетями мира. Никаких иностранных сим-карт.
                            </p>
                        </div>
                        {/* Visual Abstract */}
                        <div className="w-full md:w-1/3 aspect-square bg-gradient-to-tr from-[#007AFF] to-[#5856D6] rounded-full blur-3xl opacity-20 absolute right-0 top-1/2 -translate-y-1/2" />
                    </div>

                    {/* Feature 2: Voice */}
                    <BentoItem
                        title="Голосовой чат"
                        description="Записывайте голосовые, а бот ответит вам текстом или голосом. Идеально на ходу."
                        icon={Mic}
                    />

                    {/* Feature 3: Image Gen */}
                    <BentoItem
                        title="Генерация HD изображений"
                        description="Используйте DALL-E 3 для создания уникального контента, логотипов и иллюстраций."
                        icon={ImageIcon}
                        delay={0.1}
                    />

                    {/* Feature 4: Context */}
                    <BentoItem
                        className="md:col-span-2"
                        title="Бесконечный контекст"
                        description="Бот помнит детали вашего разговора, так что вам не придется повторять вводные данные."
                        icon={MessageSquare}
                        delay={0.2}
                    />
                </div>
            </div>
        </section>
    );
}
