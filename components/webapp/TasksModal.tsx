import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Info, Truck, ShoppingBasket, Users, Megaphone, MessageCircle, Check, Calendar } from 'lucide-react'
import { useState, useEffect } from 'react'
import ReferralModal from './ReferralModal'

interface TasksModalProps {
    isOpen: boolean
    onClose: () => void
    initData?: string
}

interface Task {
    id: string
    title: string
    description: string
    reward: number
    type: string
    link?: string
    isCompleted: boolean
    icon?: string
}

interface DailyStatus {
    canClaim: boolean
    currentStreak: number
    nextReward: number
    lastClaimDate: string | null
}

export default function TasksModal({ isOpen, onClose, initData }: TasksModalProps) {
    const [isReferralOpen, setIsReferralOpen] = useState(false)
    const [tasks, setTasks] = useState<Task[]>([])
    const [daily, setDaily] = useState<DailyStatus | null>(null)
    const [loading, setLoading] = useState(false)
    const [claiming, setClaiming] = useState<string | null>(null)

    const fetchTasks = async () => {
        // Extract user ID from initData or use mock for dev
        let userId = '123456789'; // Fallback

        if (initData) {
            try {
                const urlParams = new URLSearchParams(initData);
                const userJson = urlParams.get('user');
                if (userJson) {
                    const user = JSON.parse(userJson);
                    userId = user.id.toString();
                }
            } catch (e) {
                console.error("Error parsing initData", e);
            }
        }

        try {
            const res = await fetch(`/api/webapp/tasks?userId=${userId}`);
            const data = await res.json();
            if (data.tasks) setTasks(data.tasks);
            if (data.daily) setDaily(data.daily);
        } catch (e) {
            console.error("Failed to fetch tasks", e);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchTasks();
        }
    }, [isOpen]);

    const handleTaskClick = async (task: Task) => {
        if (task.isCompleted) return;

        // Open link first if exists
        if (task.link) {
            window.open(task.link, '_blank');
        }

        // Simple verification for MVP: wait 5s then claim ? 
        // Or just claim immediately after click? Let's claim immediately for smooth UX now.
        completeTask(task.id);
    }

    const completeTask = async (taskId: string) => {
        setClaiming(taskId);

        // Extract user ID again
        let userId = '123456789';
        if (initData) {
            try {
                const urlParams = new URLSearchParams(initData);
                const userJson = urlParams.get('user');
                if (userJson) {
                    const user = JSON.parse(userJson);
                    userId = user.id.toString();
                }
            } catch (e) { }
        }

        try {
            const res = await fetch('/api/webapp/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, taskId })
            });
            const data = await res.json();

            if (data.success) {
                // Refresh data
                fetchTasks();
                // Show success toast/vibration?
            }
        } catch (e) {
            console.error("Claim error", e);
        } finally {
            setClaiming(null);
        }
    }

    const getIcon = (iconName?: string) => {
        switch (iconName) {
            case 'Megaphone': return <Megaphone className="w-5 h-5 text-white" />;
            case 'MessageCircle': return <MessageCircle className="w-5 h-5 text-white" />;
            default: return <Info className="w-5 h-5 text-white" />;
        }
    }

    return (
        <>
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
                            className="w-full max-w-md bg-[#252527] text-white rounded-t-3xl sm:rounded-3xl p-6 pb-0 relative z-10 flex flex-col max-h-[85vh]"
                        >
                            {/* Handle Bar (Mobile) */}
                            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 absolute top-3 left-1/2 -translate-x-1/2" />

                            {/* Header */}
                            <div className="mb-6">
                                <h2 className="text-xl font-bold mb-1">Задания</h2>
                                <p className="text-gray-400 text-xs leading-relaxed">
                                    Выполняйте задания и получайте монеты
                                </p>
                            </div>

                            {/* Scrollable Content Container */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-6 px-6 pt-4 space-y-4 pb-8">

                                {/* Daily Bonus Section */}
                                {daily && (
                                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                                                    <Calendar className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">Ежедневный бонус</div>
                                                    <div className="text-[10px] text-green-300">Стрик: {daily.currentStreak} дн.</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-green-400">+{daily.nextReward} Pts</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => daily.canClaim && completeTask('daily_checkin')}
                                            disabled={!daily.canClaim || claiming === 'daily_checkin'}
                                            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${daily.canClaim
                                                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 active:scale-95'
                                                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            {claiming === 'daily_checkin' ? 'Забираем...' : daily.canClaim ? 'Забрать награду' : 'Уже получено'}
                                        </button>
                                    </div>
                                )}

                                {/* Referral Task (Always visible) */}
                                <div
                                    onClick={() => setIsReferralOpen(true)}
                                    className="bg-[#353537] rounded-2xl p-4 flex items-center gap-4 active:scale-95 transition-transform cursor-pointer border border-yellow-500/20"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-bold truncate text-white">Пригласи друга</span>
                                            <span className="text-[10px] text-gray-400">Бонусы за регистрацию и PRO</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="flex flex-col items-end leading-none">
                                            <span className="font-bold text-yellow-400 text-sm">$$$</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-500" />
                                    </div>
                                </div>

                                {/* Dynamic Tasks List */}
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-6 mb-2">Доступные задания</h3>

                                {tasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => handleTaskClick(task)}
                                        className={`bg-[#353537] rounded-2xl p-4 flex items-center gap-4 transition-transform border border-white/5 ${task.isCompleted ? 'opacity-50' : 'active:scale-95 cursor-pointer hover:border-white/10'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${task.isCompleted ? 'bg-green-500/20' : 'bg-gradient-to-br from-indigo-500 to-blue-600 shadow-blue-500/20'
                                            }`}>
                                            {task.isCompleted ? <Check className="w-5 h-5 text-green-500" /> : getIcon(task.icon)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col gap-0.5">
                                                <span className={`text-sm font-bold truncate ${task.isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
                                                    {task.title}
                                                </span>
                                                <span className="text-[10px] text-gray-400">{task.description}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {!task.isCompleted && (
                                                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg">
                                                    <span className="font-bold text-yellow-400 text-xs">+{task.reward}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Marketplace Tasks (Hardcoded for now as placeholders or keep if needed) */}
                                {/* ... keeping one just in case or remove if API handles everything ... */}
                                {/* Removing hardcoded marketplace tasks to clean up UI as requested to focus on working tasks */}

                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ReferralModal
                isOpen={isReferralOpen}
                onClose={() => setIsReferralOpen(false)}
                initData={initData}
            />
        </>
    )
}

