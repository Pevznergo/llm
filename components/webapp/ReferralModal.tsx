import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, Users, Coins, ArrowRight, Wallet, AlertCircle } from 'lucide-react'

interface ReferralModalProps {
    isOpen: boolean
    onClose: () => void
    initData?: string
}

interface ReferralData {
    referralCode: string
    referralLink: string
    inviteCount: number
    earnedPoints: number
    earnedTokens: number
    balance: number
}

export default function ReferralModal({ isOpen, onClose, initData }: ReferralModalProps) {
    const [data, setData] = useState<ReferralData | null>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const [withdrawLoading, setWithdrawLoading] = useState(false)

    useEffect(() => {
        if (isOpen && initData) {
            setLoading(true)
            fetch(`/api/webapp/referral?initData=${encodeURIComponent(initData)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        console.error(data.error)
                        return
                    }
                    setData(data)
                })
                .catch(console.error)
                .finally(() => setLoading(false))
        }
    }, [isOpen, initData])

    const handleCopy = () => {
        if (!data?.referralLink) return
        navigator.clipboard.writeText(data.referralLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleWithdraw = async () => {
        if (!data || data.balance < 2000 || !initData) return

        if (!confirm('Отправить заявку на вывод средств?')) return

        setWithdrawLoading(true)
        try {
            // Get user contact info prompt or assume profile
            // For now, simple request
            const res = await fetch('/api/webapp/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    initData,
                    amount: data.balance,
                    contactInfo: 'Profile Contact'
                })
            })
            const result = await res.json()

            if (result.success) {
                alert('Заявка отправлена! С вами свяжутся через email или Telegram.')
                // Update local balance
                setData(prev => prev ? { ...prev, balance: result.newBalance } : null)
            } else {
                alert(result.error || 'Ошибка вывода')
            }
        } catch (e) {
            alert('Ошибка сети')
        } finally {
            setWithdrawLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 sm:p-0">
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Panel */}
                    <motion.div
                        key="panel"
                        initial={{ y: '100%', opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: '100%', opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full max-w-md bg-[#1c1c1e] text-white rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
                    >
                        {/* Header Image/Gradient */}
                        <div className="h-24 bg-gradient-to-br from-purple-600 to-blue-600 relative flex items-center justify-center shrink-0">
                            <div className="absolute top-4 right-4 z-20">
                                <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors backdrop-blur-md">
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                            <h2 className="text-xl font-black italic uppercase tracking-wider text-white drop-shadow-md z-10">
                                Рефералы
                            </h2>
                            {/* Decorative circles */}
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-black/10 rounded-full blur-3xl" />
                        </div>

                        {/* Content */}
                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">

                            {/* 1. Referral Link (Moved to Top) */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-bold uppercase tracking-wider ml-1">Ваша ссылка</label>
                                {loading ? (
                                    <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
                                ) : (
                                    <div
                                        onClick={handleCopy}
                                        className="bg-[#2c2c2e] p-1 pr-4 rounded-xl border border-white/10 flex items-center gap-3 cursor-pointer group active:scale-[0.99] transition-transform"
                                    >
                                        <div className="bg-blue-500/20 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                                            {copied ? <Check className="w-5 h-5 text-blue-400" /> : <Copy className="w-5 h-5 text-blue-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-white truncate font-medium font-mono opacity-80 group-hover:opacity-100 transition-opacity">
                                                {data?.referralLink}
                                            </p>
                                        </div>
                                        <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300">
                                            {copied ? 'Скопировано' : 'Копия'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* 2. Stats (Split) */}
                            <div className="grid grid-cols-3 gap-2">
                                {/* Friends */}
                                <div className="bg-[#2c2c2e] p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1">
                                    <Users className="w-5 h-5 text-gray-400 mb-1" />
                                    <span className="text-xl font-black text-white">{loading ? '-' : data?.inviteCount || 0}</span>
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide text-center">Друзей</span>
                                </div>
                                {/* Points */}
                                <div className="bg-[#2c2c2e] p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1">
                                    <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center mb-1 shadow-inner">
                                        <span className="font-serif font-bold text-yellow-800 text-[10px]">$</span>
                                    </div>
                                    <span className="text-xl font-black text-yellow-400">{loading ? '-' : data?.earnedPoints || 0}</span>
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide text-center">Points</span>
                                </div>
                                {/* Tokens */}
                                <div className="bg-[#2c2c2e] p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1">
                                    <Wallet className="w-5 h-5 text-green-400 mb-1" />
                                    <span className="text-xl font-black text-green-400">{loading ? '-' : data?.earnedTokens || 0}</span>
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide text-center">Tokens</span>
                                </div>
                            </div>

                            {/* 3. Rules (Compressed) */}
                            <div className="bg-[#2c2c2e] rounded-2xl p-4 border border-white/5 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0">
                                        <span className="font-bold text-yellow-500 text-xs">+30</span>
                                    </div>
                                    <div className="text-xs text-gray-300 leading-tight">
                                        Бонус за каждого приглашенного друга
                                    </div>
                                </div>
                                <div className="w-full h-px bg-white/5" />
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                                        <span className="font-bold text-purple-400 text-[10px]">PRO</span>
                                    </div>
                                    <div className="text-xs text-gray-300 leading-tight">
                                        <span className="text-white font-bold">1000 токенов</span> если друг купит PRO
                                    </div>
                                </div>
                            </div>

                            {/* 4. Wallet / Withdraw */}
                            <div className="mt-auto">
                                <div className="bg-[#2c2c2e] rounded-[20px] p-5 border border-white/5">
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">Доступно к выводу</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-black text-white">{data?.balance || 0}</span>
                                                <span className="text-sm font-bold text-green-500">TOKENS</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-gray-500 block">Мин. 2000</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleWithdraw}
                                        disabled={loading || withdrawLoading || (data?.balance || 0) < 2000}
                                        className={`
                                            w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg
                                            transition-all duration-200
                                            ${(data?.balance || 0) >= 2000
                                                ? 'bg-green-500 hover:bg-green-400 text-black shadow-green-500/20 active:translate-y-0.5'
                                                : 'bg-white/5 text-white/20 cursor-not-allowed'}
                                        `}
                                    >
                                        {withdrawLoading ? 'Отправка...' : 'Вывести средства'}
                                    </button>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
