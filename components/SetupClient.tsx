"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, CheckCircle2, Loader2, ChevronRight, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";

interface Group {
    id: number;
    code: string;
    tg_chat_id: string;
    title: string;
    district: string;
    target_url: string;
}

export default function SetupClient({ code }: { code: string }) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [savingId, setSavingId] = useState<number | null>(null);
    const [success, setSuccess] = useState(false);
    const [currentLink, setCurrentLink] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        // Fetch groups
        fetch("/api/groups")
            .then(res => res.json())
            .then(data => {
                setGroups(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        // Fetch current link status
        fetch(`/api/links/${code}`)
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    setCurrentLink(data);
                }
            })
            .catch(console.error);
    }, [code]);

    const handleUnlink = async () => {
        if (!confirm("Вы уверены, что хотите отвязать группу? QR-код перестанет работать.")) return;
        setSavingId(-1); // Use -1 as indicator for unlinking
        try {
            const res = await fetch(`/api/links/${code}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tgChatId: null
                })
            });
            if (res.ok) {
                alert("Успешно отвязано");
                setCurrentLink(null);
                // Optional: reload page or update state
            }
        } catch (e) {
            alert("Ошибка при отвязке");
        } finally {
            setSavingId(null);
        }
    };

    const filteredGroups = groups.filter(g =>
        (g.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.district || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = async (group: Group) => {
        setSavingId(group.id);
        try {
            const res = await fetch(`/api/links/${code}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tgChatId: group.tg_chat_id,
                    title: group.title,
                    district: group.district,
                    targetUrl: group.target_url // Use the group's invite link
                })
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push(`/s/${code}`), 1500);
            } else {
                const data = await res.json();
                alert(data.error || "Ошибка при сохранении");
            }
        } catch (e: any) {
            alert("Ошибка сети или сервера");
        } finally {
            setSavingId(null);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Готово!</h1>
                <p className="text-slate-400">QR-код успешно привязан. Сейчас вы будете перенаправлены в группу.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold">Настройка QR</h1>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <QrCode className="w-3 h-3" /> {code}
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                </div>
            </header>

            <main className="p-4 space-y-4 pb-20">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        inputMode="decimal" // Shows numeric keyboard on mobile
                        pattern="[0-9]*"
                        autoFocus
                        placeholder="Поиск..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg font-medium" // Increased font size for better readability
                    />
                </div>

                <div className="text-[10px] text-slate-500 uppercase tracking-widest px-1 mb-2 flex justify-between items-center">
                    <span>Выберите группу для привязки:</span>
                    {/* Promo Action Button */}
                    <button
                        onClick={async () => {
                            const chatId = prompt("Введите ID группы (начинается с -100) для создания игры:");
                            if (!chatId) return;

                            try {
                                const res = await fetch("/api/admin/create-topic-promo", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ chatId })
                                });
                                const data = await res.json();
                                if (res.ok) {
                                    alert(`Игра создана! Топик ID: ${data.threadId}\n\nСсылка на приложение:\n${data.appLink}`);
                                } else {
                                    alert("Ошибка: " + data.error);
                                }
                            } catch (e: any) {
                                alert("Ошибка сети");
                            }
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-md hover:bg-yellow-500/20 transition-colors text-[9px] font-bold"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="11" x2="10" y2="11" /><line x1="8" y1="9" x2="8" y2="13" /><rect width="22" height="14" x="1" y="6" rx="2" ry="2" /><path d="M9 1l2 2 3.5-3.5" /><path d="M15 12h.01" /><path d="M18 11h.01" /></svg>
                        СОЗДАТЬ ИГРУ
                    </button>
                </div>

                {/* Current Link Status - Unlink Button */}
                {currentLink && currentLink.targetUrl && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase text-indigo-400">Текущая привязка</span>
                            <span className="text-sm font-semibold truncate max-w-[200px]">{currentLink.targetUrl}</span>
                        </div>
                        <button
                            onClick={handleUnlink}
                            disabled={savingId !== null}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-xl transition-all"
                        >
                            Отвязать
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-xs">Загрузка групп...</span>
                    </div>
                ) : filteredGroups.length > 0 ? (
                    <div className="grid gap-3">
                        {filteredGroups.map(group => (
                            <button
                                key={group.id}
                                onClick={() => handleSelect(group)}
                                disabled={savingId !== null}
                                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between active:scale-[0.98] ${savingId === group.id
                                    ? 'bg-indigo-500/20 border-indigo-500/50'
                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div className="space-y-1 flex-1 min-w-0 pr-4">
                                    <div className="font-semibold truncate">{group.title || "Без названия"}</div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <MapPin className="w-3 h-3" />
                                        {group.district || "Город не указан"}
                                    </div>
                                </div>
                                {savingId === group.id ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-slate-600" />
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 space-y-4">
                        <div className="text-slate-600">Группы не найдены</div>
                        <button
                            onClick={() => setSearchTerm("")}
                            className="px-6 py-2 bg-white/5 rounded-full text-xs font-semibold hover:bg-white/10 transition-all"
                        >
                            Сбросить поиск
                        </button>
                    </div>
                )}
            </main>

            {/* Footer Tip */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent p-6 pointer-events-none">
                <div className="max-w-xs mx-auto bg-indigo-500/10 border border-indigo-500/20 rounded-full py-2 px-4 shadow-2xl backdrop-blur-md">
                    <p className="text-[9px] text-indigo-300 text-center uppercase tracking-tighter font-bold">
                        Нажмите на группу, чтобы привязать QR-код
                    </p>
                </div>
            </div>
        </div>
    );
}
