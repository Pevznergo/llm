'use client'

import { motion } from 'framer-motion'
import { X, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'

interface WinModalProps {
    prize: any
    onClose: () => void
}

export default function WinModal({ prize, onClose }: WinModalProps) {
    const [timeLeft, setTimeLeft] = useState("23:59:59");

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const diff = tomorrow.getTime() - now.getTime();

            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Determine content based on prize type
    const isPoints = prize.type === 'points';
    const title = isPoints ? `Вы выиграли ${prize.value} монет!` : prize.name;
    const subtitle = isPoints ? 'Монеты зачислены на ваш счет' : 'Уже применилась к цене, сгорит через 24 часа';
    const buttonText = isPoints ? 'Отлично' : 'К товарам';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
        >
            {/* Backdrop with Radial Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#8B4513_0%,#5D2906_100%)]" />

            {/* Shine Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,white_15deg,transparent_30deg)] opacity-10 blur-3xl animate-[spin_10s_linear_infinite]" />

            {/* Content Container */}
            <div className="relative w-full max-w-sm flex flex-col items-center text-center z-10 space-y-6">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-16 -right-2 w-10 h-10 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Stars/Sparkles Decoration */}
                <div className="absolute top-0 right-10 text-yellow-400 animate-pulse">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                </div>
                <div className="absolute bottom-40 left-0 text-yellow-400 animate-pulse delay-700">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                </div>

                {/* Main Image Layering */}
                <div className="relative w-64 h-64 mb-4">
                    {/* Prize Image */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {prize.image_url ? (
                            <img src={prize.image_url} alt={prize.name} className="w-full h-full object-contain drop-shadow-2xl" />
                        ) : (
                            <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center text-6xl">🎁</div>
                        )}
                    </div>
                </div>

                {/* Timer Pill */}
                {!isPoints && (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-white font-mono text-sm tracking-widest shadow-lg">
                        {timeLeft}
                    </div>
                )}

                {/* Texts */}
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white leading-tight drop-shadow-lg">
                        {title}
                    </h2>
                    <p className="text-white/80 text-sm font-medium leading-normal">
                        {subtitle}
                    </p>
                </div>

                {/* CTA Button */}
                <button
                    onClick={onClose}
                    className="w-full h-14 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-black font-black text-lg rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
                >
                    {buttonText}
                </button>

                {/* Footer Link */}
                <button className="text-white/50 text-xs underline hover:text-white transition-colors">
                    Условия акции
                </button>
            </div>
        </motion.div>
    )
}
