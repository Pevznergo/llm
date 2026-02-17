import { useState, useEffect } from 'react'
import { X, Check, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface DailyBonusProps {
    isOpen: boolean
    onClose: () => void
    streak: number // Current streak (1-7)
    lastClaimDate: string | null // ISO string
    onClaim: () => Promise<void>
}

// Rewards configuration
const REWARDS = [10, 15, 15, 20, 20, 25, 25]

export default function DailyBonus({ isOpen, onClose, streak, lastClaimDate, onClaim }: DailyBonusProps) {
    const [timeLeft, setTimeLeft] = useState('')

    // Timer Logic: Count down to midnight
    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const diff = tomorrow.getTime() - now.getTime();
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };
        const timer = setInterval(updateTimer, 1000);
        updateTimer();
        return () => clearInterval(timer);
    }, []);

    const isClaimedToday = () => {
        if (!lastClaimDate) return false
        const last = new Date(lastClaimDate)
        const now = new Date()
        return last.toDateString() === now.toDateString()
    }

    const claimedToday = isClaimedToday()
    const currentDayIndex = claimedToday ? streak - 1 : streak

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Panel */}
                    <motion.div
                        key="panel"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full max-w-md bg-[#1c1c1e] text-white rounded-t-3xl sm:rounded-3xl p-6 pb-12 relative z-10"
                    >
                        {/* Handle Bar (Mobile) */}
                        <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6 absolute top-3 left-1/2 -translate-x-1/2" />

                        {/* Header */}
                        <div className="text-center mb-8 mt-2">
                            <h2 className="text-2xl font-bold mb-2">Монетки за вход</h2>
                            <p className="text-gray-400 text-sm px-6 leading-relaxed">
                                Заходите каждый день, чтобы собрать как можно больше монеток за неделю
                            </p>
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-4 gap-3 mb-8">
                            {REWARDS.map((amount, index) => {
                                const dayNum = index + 1
                                const isToday = index === currentDayIndex

                                let state = 'locked'
                                if (index < streak) {
                                    state = 'collected'
                                } else if (index === streak && !claimedToday) {
                                    state = 'active'
                                }

                                return (
                                    <div
                                        key={index}
                                        onClick={() => state === 'active' ? onClaim() : null}
                                        className="flex flex-col items-center relative"
                                        style={{
                                            gridColumn: index >= 4 ? 'auto' : 'auto'
                                        }}
                                    >
                                        {/* Label above card */}
                                        <span className={`text-[10px] font-bold mb-1.5 ${isToday ? 'text-white' : 'text-gray-500'}`}>
                                            {isToday ? 'Сегодня' : `${dayNum} день`}
                                        </span>

                                        {/* Card Body */}
                                        <div className={`
                                            relative w-full aspect-[4/5] rounded-3xl flex flex-col items-center justify-center
                                            transition-all duration-200
                                            ${state === 'active' ? 'bg-[#ffe600] scale-105 shadow-[0_0_20px_rgba(255,230,0,0.3)] z-10 cursor-pointer' : ''}
                                            ${state === 'collected' ? 'bg-[#dcfce7]' : ''}
                                            ${state === 'locked' ? 'bg-[#2c2c2e]' : ''}
                                        `}>
                                            {/* Top Right Badge */}
                                            {state === 'collected' && (
                                                <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#22c55e] rounded-full flex items-center justify-center p-0.5">
                                                    <Check className="w-full h-full text-white stroke-[3]" />
                                                </div>
                                            )}
                                            {state === 'active' && (
                                                <div className="absolute top-1 right-1">
                                                    <span className="text-lg leading-none animate-pulse">✨</span>
                                                </div>
                                            )}

                                            {/* Amount Number */}
                                            <div className={`text-2xl font-black mb-3 ${state === 'locked' ? 'text-white/40' : 'text-black'}`}>
                                                {amount}
                                            </div>

                                            {/* Bottom Coin Icon (Overlapping bottom edge) */}
                                            <div className={`
                                                absolute -bottom-3.5 w-7 h-7 rounded-full border-[3px] flex items-center justify-center shadow-sm
                                                ${state === 'active' ? 'bg-[#eab308] border-[#ffe600] text-yellow-900' : ''}
                                                ${state === 'collected' ? 'bg-[#94a3b8] border-[#dcfce7] text-slate-600' : ''}
                                                ${state === 'locked' ? 'bg-[#4b5563] border-[#2c2c2e] text-gray-400' : ''}
                                            `}>
                                                <Coins className="w-3.5 h-3.5 fill-current" />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <style jsx>{`
                            .grid-cols-4 {
                                display: flex;
                                flex-wrap: wrap;
                                justify-content: center;
                            }
                            .grid-cols-4 > div {
                                width: calc(25% - 0.75rem);
                                margin-bottom: 1.5rem; /* Increased margin for overlapping coins */
                                min-width: 65px;
                            }
                        `}</style>

                        {/* Footer Action Panel */}
                        <div className="mt-4">
                            {!claimedToday ? (
                                <button
                                    onClick={() => onClaim()}
                                    className="w-full bg-white text-black font-black text-lg py-4 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 uppercase tracking-wide italic"
                                >
                                    <span>ЗАБРАТЬ НАГРАДУ</span>
                                </button>
                            ) : (
                                <div className="bg-[#2c2c2e] rounded-2xl py-3 px-4 flex flex-col items-center justify-center border border-white/5">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Новая награда через</span>
                                    <span className="text-lg font-mono font-bold text-white tracking-widest leading-none">{timeLeft}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
