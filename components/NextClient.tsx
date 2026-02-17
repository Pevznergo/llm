"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
    Loader2, Send, QrCode, Download, History as HistoryIcon,
    MessageSquare, ExternalLink, Trash2, Search,
    Link as LinkIcon, Link2Off, MapPin, Edit3, CheckCircle2,
    Clock,
    CheckSquare,
    X,
    ChevronLeft, ChevronRight,
    AlertCircle, List, Map as MapIcon, Globe, Printer, Play,
    Clipboard as ClipboardIcon, Plus, Gift, Edit, RefreshCcw, RefreshCw, BarChart as BarChartIcon, Megaphone
} from "lucide-react";
import QRCodeLib from "qrcode";
import dynamic from "next/dynamic";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';


const QrCodeDisplay = ({ value, size = 128 }: { value: string, size?: number }) => {
    const [dataUrl, setDataUrl] = useState<string>("");

    useEffect(() => {
        QRCodeLib.toDataURL(value, { width: size, margin: 1 })
            .then(setDataUrl)
            .catch(err => console.error(err));
    }, [value, size]);

    if (!dataUrl) return <div style={{ width: size, height: size }} className="bg-white/5 animate-pulse rounded-xl" />;

    return <img src={dataUrl} alt="QR Code" style={{ width: size, height: size }} className="rounded-xl bg-white p-2" />;
};





interface ShortLink {
    id: number;
    code: string;
    target_url: string;
    created_at: string;
    clicks_count?: number;
    member_count?: number;
    tg_chat_id?: string;
    reviewer_name?: string; // used as title for ecosystems
    district?: string;
    status?: string;
    is_stuck?: boolean;
    sticker_title?: string;
    sticker_features?: string;
    sticker_prizes?: string;
}

interface Ecosystem {
    id: number;
    tg_chat_id: string;
    title: string;
    district: string;
    invite_link: string;
    marketplace_topic_id?: number;
    admin_topic_id?: number;
    member_count: number;
    last_updated: string;
    created_at: string;
    status?: string;
    codes: string[];
}

interface QueueItem {
    id: number;
    title: string;
    district: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    scheduled_at: string;
    error?: string;
}



interface StatisticsTabProps {
    // No props needed as it fetches its own data
}

function StatisticsTab() {
    const [data, setData] = useState<{
        timeline: { date: string, count: number }[],
        summary: {
            totalChats: number,
            totalQr: number,
            totalClicks: number,
            totalSubscribers: number,
            totalUsers: number,
            totalSpins: number,
            totalRequests: number,
            totalReferralUsers: number,
            totalPaidUsers: number,
            totalPaidReferralUsers: number
        }
    } | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = () => {
        setLoading(true);
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load stats", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Всего кликов</div>
                    <div className="text-3xl font-bold text-emerald-400">{data.summary.totalClicks}</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Пользователей</div>
                    <div className="text-3xl font-bold text-blue-400">{data.summary.totalUsers}</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Вращений колеса</div>
                    <div className="text-3xl font-bold text-yellow-400">{data.summary.totalSpins}</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Всего запросов</div>
                    <div className="text-3xl font-bold text-pink-400">{data.summary.totalRequests}</div>
                </div>

                {/* Row 2 - Referral & Paid Stats */}
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Пришли по реф.</div>
                    <div className="text-3xl font-bold text-orange-400">{data.summary.totalReferralUsers}</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Платные польз.</div>
                    <div className="text-3xl font-bold text-teal-400">{data.summary.totalPaidUsers}</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Платные (реф.)</div>
                    <div className="text-3xl font-bold text-cyan-400">{data.summary.totalPaidReferralUsers}</div>
                </div>
            </div>

            {/* Charts */}
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white">Динамика новых пользователей</h3>
                        <p className="text-slate-500 text-xs">Количество регистраций по дням</p>
                    </div>
                    <button
                        onClick={async () => {
                            if (!confirm("Обновить статистику участников? Это может занять время.")) return;
                            try {
                                setLoading(true); // lock
                                await fetch("/api/queue", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        type: 'sync_stats',
                                        payload: {},
                                        status: 'pending',
                                        scheduled_at: new Date().toISOString()
                                    })
                                });
                                // Trigger immediately
                                await fetch("/api/queue/process?force=true");

                                // Instead of reload, just fetch new stats
                                await fetchStats();
                                alert("Статистика успешно обновлена!");
                            } catch (e) {
                                alert("Ошибка обновления");
                                setLoading(false);
                            }
                        }}
                        className={`px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loading}
                    >
                        <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Синхронизация...' : 'Синхронизация'}
                    </button>
                    <button
                        onClick={fetchStats}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Обновить цифры
                    </button>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.timeline}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="date"
                                stroke="rgba(255,255,255,0.3)"
                                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                tickFormatter={(str) => {
                                    const date = new Date(str);
                                    return `${date.getDate()}.${date.getMonth() + 1}`;
                                }}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.3)"
                                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#6366f1"
                                fillOpacity={1}
                                fill="url(#colorCount)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}



interface NextClientProps {
    initialLinks: ShortLink[];
    initialEcosystems: Ecosystem[];
}

export default function NextClient({ initialLinks, initialEcosystems }: NextClientProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<{ title: string, district: string }>();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ link: string; title: string } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [links, setLinks] = useState<ShortLink[]>(initialLinks);
    const [ecosystems, setEcosystems] = useState<Ecosystem[]>(initialEcosystems);
    const [error, setError] = useState<string | null>(null);
    const [printCopies, setPrintCopies] = useState(1);
    const [printModalState, setPrintModalState] = useState<{ isOpen: boolean, link: ShortLink | null }>({ isOpen: false, link: null });
    const [modalPrintCopies, setModalPrintCopies] = useState(1);
    const [activeTab, setActiveTab] = useState<'ecosystem' | 'qr_batch' | 'stats' | 'prizes'>('qr_batch');
    const [batchLoading, setBatchLoading] = useState(false);
    const [batchResult, setBatchResult] = useState<{ count: number } | null>(null);
    const [editingTarget, setEditingTarget] = useState<{ id: number; value: string } | null>(null);
    const [editingGroup, setEditingGroup] = useState<{ id?: number; tgChatId: string; title: string; district: string } | null>(null);
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [topicActionData, setTopicActionData] = useState({
        topicName: "📢 Новости",
        message: "",
        pin: true,
        closedAction: undefined as 'close' | 'open' | undefined
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [refreshingId, setRefreshingId] = useState<number | null>(null);
    const [stuckFilter, setStuckFilter] = useState<'all' | 'stuck' | 'not_stuck'>('all');
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [batchInput, setBatchInput] = useState("");
    const [batchInterval, setBatchInterval] = useState(15);

    const [editingQueueItem, setEditingQueueItem] = useState<QueueItem | null>(null);
    const [nextTask, setNextTask] = useState<{ title: string, scheduled_at: string } | null>(null);
    const [countdown, setCountdown] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'активен' | 'распечатан' | 'приклеен' | 'не распечатан' | 'не подключен' | 'подключен' | 'архив'>('all');
    const [groupSearchTerm, setGroupSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [topicActionProgress, setTopicActionProgress] = useState<{ current: number, total: number } | null>(null);

    // Prizes State
    const [prizes, setPrizes] = useState<any[]>([]);
    const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
    const [editingPrize, setEditingPrize] = useState<any | null>(null);
    const [prizeForm, setPrizeForm] = useState({
        name: '',
        type: 'points',
        value: '',
        probability: 0,
        quantity: -1, // -1 or null for unlimited
        image_url: '',
        description: '',
        is_active: true,
        file: null as File | null
    });

    // Sticker Settings State
    const [stickerSettings, setStickerSettings] = useState({
        mainTitle: 'ЧАТ СОСЕДЕЙ🏠',
        featuresTitle: 'КОЛЕСО ПРИЗОВ:',
        prizesList: 'WB/OZON/iPhone',
        batchSize: 24,
        targetUrl: 'https://t.me/aporto_bot',
        useUtm: true
    });


    const slugify = (text: string) => {
        const trans: { [key: string]: string } = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
            'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
            'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
            'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
            'я': 'ya', ' ': '_'
        };
        return text.toLowerCase().split('').map(char => trans[char] || char).join('').replace(/[^a-z0-9_]/g, '');
    };

    // Generic Print Function
    const printLinks = async (linksToPrint: ShortLink[], quantity: number = 1) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Не удалось открыть окно печати. Разрешите всплывающие окна.");
            return;
        }

        // Expand for printing
        const expandedLinks: ShortLink[] = [];
        linksToPrint.forEach(link => {
            for (let i = 0; i < quantity; i++) {
                expandedLinks.push(link);
            }
        });

        // Chunk into pages of 24 (3 cols * 8 rows)
        const PAGESIZE = 24;
        const pages = [];
        for (let i = 0; i < expandedLinks.length; i += PAGESIZE) {
            pages.push(expandedLinks.slice(i, i + PAGESIZE));
        }

        let fullHtml = '';
        for (const pageItems of pages) {
            let stickersHtml = '';
            for (const link of pageItems) {
                const shortUrl = `https://aporto.tech/s/${link.code}`;
                try {
                    const qrData = await QRCodeLib.toDataURL(shortUrl, {
                        width: 200,
                        margin: 2,
                        color: { dark: '#000000', light: '#ffffff' }
                    });

                    stickersHtml += `
                        <div class="sticker">
                            <div class="sticker-inner">
                                <div class="qr-box">
                                    <img src="${qrData}" alt="QR" />
                                </div>
                                <div class="content-box">
                                    <h1 class="main-title">
                                        <svg class="tg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
                                        </svg>
                                        ${link.sticker_title || stickerSettings.mainTitle}
                                    </h1>
                                    <div class="features">
                                    ${link.sticker_features || stickerSettings.featuresTitle}
                                    </div>
                                    <div class="prizes">
                                        ${link.sticker_prizes || stickerSettings.prizesList}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                } catch (err) {
                    console.error(`Failed to generate QR for ${link.code}`, err);
                }
            }
            fullHtml += `<div class="page">${stickersHtml}</div>`;
        }

        // Update statuses
        for (const link of linksToPrint) {
            // We only update status if it's not already printed? Or always. 
            // Only update DB status if it's currently 'не распечатан'
            if (link.status === 'не распечатан') {
                handleUpdateStatus(link.code, link.id, 'распечатан');
            }
        }

        printWindow.document.write(`
            <html>
            <head>
                <title>Печать наклеек A4 (70x37mm)</title>
                <style>
                    @page { size: A4; margin: 0; }
                    body { margin: 0; padding: 0; background: white; color: black; -webkit-print-color-adjust: exact; }
                    .page { width: 210mm; height: 297mm; display: grid; grid-template-columns: repeat(3, 70mm); grid-template-rows: repeat(8, 37.125mm); position: relative; overflow: hidden; page-break-after: always; }
                    .sticker { box-sizing: border-box; width: 70mm; height: 37mm; padding: 4mm 2mm; overflow: hidden; }
                    .sticker-inner { display: flex; gap: 2mm; height: 100%; align-items: center; }
                    .qr-box { width: 25mm; flex-shrink: 0; }
                    .qr-box img { width: 100%; height: auto; display: block; }
                    .content-box { flex: 1; display: flex; flex-direction: column; justify-content: center; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: left; }
                    .main-title { margin: 0; padding: 0; font-size: 15px; font-weight: 900; line-height: 1; text-transform: uppercase; margin-bottom: 1mm; white-space: nowrap; display: flex; align-items: center; gap: 1mm; padding-left: 1mm; }
                    .tg-icon { width: 4.5mm; height: 4.5mm; flex-shrink: 0; }
                    .features { font-size: 11px; font-weight: 700; color: #000; background: #eee; padding: 0.5mm 1.5mm; border-radius: 2mm; width: fit-content; margin-bottom: 0.5mm; margin-left: 1mm; text-transform: uppercase; text-align: center; }
                    .prizes { font-family: 'Arial Black', Gadget, sans-serif; font-size: 13px; font-weight: 900; color: black; text-transform: uppercase; margin-top: 1mm; margin-left: 1mm; line-height: 1; }
                    @media print { .no-print { display: none; } .sticker { border: none; page-break-inside: avoid; } .features { -webkit-print-color-adjust: exact; background: #eee; } }
                </style>
            </head>
            <body>
                ${fullHtml}
                <script>
                    window.onload = function() { setTimeout(() => { window.print(); }, 500); };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleTargetedBatchGenerate = async () => {
        if (!stickerSettings.targetUrl && !confirm("URL для привязки не указан. Создать пустые ссылки?")) {
            return;
        }

        setBatchLoading(true);
        try {
            let finalUrl = stickerSettings.targetUrl;
            if (stickerSettings.useUtm && finalUrl) {
                const separator = finalUrl.includes('?') ? '&' : '?';
                // Map all sticker fields to UTM parameters
                const source = slugify(stickerSettings.mainTitle) || 'qr';
                const campaign = slugify(stickerSettings.featuresTitle) || 'features';
                const content = slugify(stickerSettings.prizesList) || 'prizes';

                // Using sticker title as source, 'qr' as medium (standard), features as campaign, prizes as content
                finalUrl += `${separator}utm_source=${source}&utm_medium=qr&utm_campaign=${campaign}&utm_content=${content}`;
            }

            const res = await fetch("/api/links/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    count: 1, // Create 1 link
                    targetUrl: finalUrl,
                    title: stickerSettings.mainTitle,
                    features: stickerSettings.featuresTitle,
                    prizes: stickerSettings.prizesList
                })
            });

            const data = await res.json() as { success: boolean, links: ShortLink[] };
            if (!res.ok) throw new Error((data as any).error || "Failed to generate batch");

            const newLinks = data.links;
            setLinks(prev => [...newLinks, ...prev]);

            setBatchResult({ count: newLinks.length });
            alert("QR-код создан! Найдите его в таблице ниже и нажмите печать.");

        } catch (e: any) {
            alert(e.message);
        } finally {
            setBatchLoading(false);
        }
    };

    const ITEMS_PER_PAGE = 20;




    // Filter logic
    const filterLinks = (list: ShortLink[]) => {
        let filtered = list;

        // 1. Text search (code, title, district, url)
        if (searchTerm) {
            const low = searchTerm.toLowerCase();
            filtered = filtered.filter(l =>
                l.code.toLowerCase().includes(low) ||
                (l.reviewer_name || "").toLowerCase().includes(low) ||
                (l.district || "").toLowerCase().includes(low) ||
                (l.target_url || "").toLowerCase().includes(low)
            );
        }

        // 2. Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(l => l.status === statusFilter);
        }

        // 3. Group Search (filter by ecosystem title)
        if (groupSearchTerm) {
            const lowGroup = groupSearchTerm.toLowerCase();
            filtered = filtered.filter(l => (l.reviewer_name || "").toLowerCase().includes(lowGroup));
        }

        return filtered;
    };

    const filterByStuck = (list: any[]) => {
        let filtered = list;
        if (stuckFilter !== 'all') {
            filtered = filtered.filter(l => stuckFilter === 'stuck' ? l.is_stuck : !l.is_stuck);
        }
        return filtered;
    };

    const filteredAllLinks = filterByStuck(filterLinks(links));
    const totalQrPages = Math.ceil(filteredAllLinks.length / ITEMS_PER_PAGE);
    const paginatedLinks = filteredAllLinks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, stuckFilter, statusFilter, groupSearchTerm]);

    // Fetch Prizes
    useEffect(() => {
        if (activeTab === 'prizes') {
            fetch('/api/admin/prizes')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setPrizes(data);
                })
                .catch(err => console.error("Failed to fetch prizes", err));
        }
    }, [activeTab]);

    const handleToggleGroupSelect = (tgChatId: string) => {
        setSelectedGroupIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tgChatId)) {
                newSet.delete(tgChatId);
            } else {
                newSet.add(tgChatId);
            }
            return newSet;
        });
    };

    const handleSelectAllGroups = () => {
        if (selectedGroupIds.size === paginatedEcosystems.length) {
            setSelectedGroupIds(new Set());
        } else {
            setSelectedGroupIds(new Set(paginatedEcosystems.map(e => e.tg_chat_id)));
        }
    };

    const handleBatchTopicAction = async () => {
        if (selectedGroupIds.size === 0) return;
        setBatchLoading(true);
        try {
            const res = await fetch("/api/topic-queue/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chatIds: Array.from(selectedGroupIds),
                    ...topicActionData
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to enqueue");

            alert(`Добавлено ${data.count} задач в очередь. Запустите обработчик или настройте Cron.`);
            setSelectedGroupIds(new Set());
        } catch (e: any) {
            alert("Ошибка при добавлении в очередь: " + e.message);
        } finally {
            setBatchLoading(false);
        }
    };

    const handleProcessTopicQueue = async () => {
        setBatchLoading(true);
        try {
            // Process loop 
            // We loop until no pending tasks or stopped
            let processing = true;
            let processedCount = 0;

            while (processing) {
                const res = await fetch("/api/topic-queue/process");
                const data = await res.json();

                if (!res.ok || !data.success) {
                    if (data.message === "No pending tasks") {
                        alert("Очередь пуста или все задачи выполнены.");
                    } else {
                        console.error("Task failed:", data.error);
                    }
                    processing = false;
                    break;
                }

                processedCount++;
                // Update UI feedback if needed (using topicActionProgress state perhaps)
                setTopicActionProgress({ current: processedCount, total: 999 }); // optimizing since we don't know total easily without extra call

                // Delay 30-60s
                const delay = Math.floor(Math.random() * 30000) + 30000;
                await new Promise(r => setTimeout(r, delay));
            }
        } catch (e: any) {
            console.error(e);
            alert("Ошибка обработчика");
        } finally {
            setBatchLoading(false);
            setTopicActionProgress(null);
        }
    };
    // Ecosystem rendering logic
    const ecosystemTableData = ecosystems.map(eco => {
        const associatedLinks = links.filter(l => l.tg_chat_id === eco.tg_chat_id);
        const codes = associatedLinks.map(l => l.code);
        const totalClicks = associatedLinks.reduce((sum, l) => sum + (l.clicks_count || 0), 0);
        // Fix: Derive stuck status from links since it's not on the ecosystem record itself
        const isStuck = associatedLinks.some(l => l.is_stuck);

        return {
            ...eco,
            codes,
            total_clicks: totalClicks,
            is_stuck: isStuck,
            // For searchability by code:
            code: codes.join(', ')
        };
    });

    const filterEcosystems = (list: any[]) => {
        let filtered = list;

        // Global Search
        if (searchTerm) {
            const low = searchTerm.toLowerCase();
            filtered = filtered.filter(e =>
                e.title.toLowerCase().includes(low) ||
                (e.district || "").toLowerCase().includes(low) ||
                e.codes.some((c: string) => c.toLowerCase().includes(low))
            );
        }

        // Specific Group Search
        if (groupSearchTerm) {
            const low = groupSearchTerm.toLowerCase();
            filtered = filtered.filter(e =>
                e.title.toLowerCase().includes(low) ||
                (e.district || "").toLowerCase().includes(low) ||
                e.codes.some((c: string) => c.toLowerCase().includes(low))
            );
        }

        return filtered;
    };

    const filteredEcosystems = filterByStuck(filterEcosystems(ecosystemTableData));
    const totalPages = Math.ceil(filteredEcosystems.length / ITEMS_PER_PAGE);
    const paginatedEcosystems = filteredEcosystems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const fetchQueue = async () => {
        try {
            const res = await fetch("/api/queue");
            if (res.ok) {
                const data = await res.json();
                if (data.items) {
                    setQueue(data.items);
                    setNextTask(data.nextTask);
                } else {
                    setQueue(data); // Fallback for old API if any
                }
            }
        } catch (e) {
            console.error("Failed to fetch queue", e);
        }
    };

    // Countdown logic
    useEffect(() => {
        if (!nextTask) {
            setCountdown(null);
            return;
        }

        const timer = setInterval(() => {
            const now = new Date();
            const scheduled = new Date(nextTask.scheduled_at);
            const diffMs = scheduled.getTime() - now.getTime();

            if (diffMs <= 0) {
                setCountdown("в обработке...");
                // Fetch queue to see if it moved
                fetchQueue();
                clearInterval(timer);
            } else {
                const totalSeconds = Math.floor(diffMs / 1000);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [nextTask]);

    // We no longer use localStorage history since we have DB-backed initialLinks
    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const onSubmit = async (data: { title: string, district: string }) => {
        setLoading(true);
        setError(null);

        // Duplicate check
        const normalizedTitle = data.title.toLowerCase().trim();
        const isDuplicate = ecosystems.some(e => e.title.toLowerCase().trim() === normalizedTitle) ||
            queue.some(q => q.title.toLowerCase().trim() === normalizedTitle && q.status !== 'failed');

        if (isDuplicate) {
            setError("Чат с таким адресом уже существует или находится в очереди.");
            setLoading(false);
            return;
        }
        setResult(null);

        try {
            const res = await fetch("/api/create-chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Secret-Key": process.env.NEXT_PUBLIC_APP_SECRET_KEY || "", // Using public env for MVP simplicity
                },
                body: JSON.stringify(data),
            });

            const resultData = await res.json();

            if (!res.ok) {
                throw new Error(resultData.error || "Failed to create chat");
            }

            const newEco: Ecosystem = {
                id: resultData.id || 0, // Server should return ID
                tg_chat_id: resultData.chatId,
                title: data.title,
                district: data.district,
                invite_link: resultData.link,
                member_count: 0,
                last_updated: new Date().toISOString(),
                created_at: new Date().toISOString(),
                status: 'не подключен',
                codes: []
            };

            setEcosystems([newEco, ...ecosystems]);
            setResult({ link: resultData.link, title: data.title });
            reset();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEcosystem = async (tgChatId: string, codes: string[]) => {
        if (!confirm(`Удалить экосистему и все связанные ссылки (${codes.length})?`)) return;

        try {
            const res = await fetch('/api/ecosystems', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tgChatId })
            });

            if (res.ok) {
                setEcosystems(prev => prev.filter(e => e.tg_chat_id !== tgChatId));
                // Optionally delete linked short links too, but the API presently only deletes the ecosystem.
                // The user might want to keep the short links but unlink them.
                // For now, just remove from state.
                setLinks(prev => prev.map(l => l.tg_chat_id === tgChatId ? { ...l, tg_chat_id: undefined } : l));
            }
        } catch (e) {
            alert('Ошибка при удалении');
        }
    };

    const handleUnlinkCode = async (code: string, ecosystemTitle: string, tgChatId: string) => {
        if (!confirm(`Вы уверены, что хотите отвязать код ${code} от "${ecosystemTitle}"?`)) return;

        try {
            const res = await fetch(`/api/links/${code}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tgChatId: null })
            });

            if (res.ok) {
                // Update links state: remove tg_chat_id from the link
                setLinks(prev => prev.map(l => l.code === code ? { ...l, tg_chat_id: undefined } : l));
            } else {
                alert("Ошибка при отвязке");
            }
        } catch (e) {
            alert("Ошибка сети");
        }
    };

    const handleUpdateEcosystem = async (tgChatId: string) => {
        if (!editingGroup) return;
        try {
            const res = await fetch('/api/ecosystems', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tgChatId,
                    title: editingGroup.title,
                    district: editingGroup.district
                })
            });
            if (res.ok) {
                setEcosystems(prev => prev.map(e => e.tg_chat_id === tgChatId ? {
                    ...e,
                    title: editingGroup.title,
                    district: editingGroup.district
                } : e));
                setEditingGroup(null);
            }
        } catch (e) {
            alert('Ошибка при обновлении');
        }
    };

    const handleRefreshStats = async (code: string, id: number) => {
        setRefreshingId(id);
        try {
            const res = await fetch(`/api/links/${code}`);
            const data = await res.json();
            if (res.ok) {
                setLinks(prev => prev.map(l => l.id === id ? {
                    ...l,
                    clicks_count: data.clicks,
                    member_count: data.memberCount
                } : l));
            }
        } catch (e) {
            console.error("Failed to refresh stats", e);
        } finally {
            setRefreshingId(null);
        }
    };

    const downloadQR = async (link: string, title: string) => {
        try {
            const dataUrl = await QRCodeLib.toDataURL(link, { width: 600, margin: 2 });
            const downloadLink = document.createElement("a");
            downloadLink.href = dataUrl;
            downloadLink.download = `QR_${title.replace(/\s+/g, "_")}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        } catch (err) {
            console.error("Failed to generate QR for download", err);
        }
    };

    const handleToggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        const filteredIds = filteredAllLinks.map(l => l.id);
        const isAllSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id));

        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredIds));
        }
    };

    const handleSavePrize = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingPrize ? 'PUT' : 'POST';

            const formData = new FormData();
            if (editingPrize) formData.append('id', editingPrize.id.toString());
            formData.append('name', prizeForm.name);
            formData.append('type', prizeForm.type);
            formData.append('value', prizeForm.value);
            formData.append('probability', prizeForm.probability.toString());
            formData.append('quantity', prizeForm.quantity.toString());
            formData.append('description', prizeForm.description || '');
            formData.append('is_active', String(prizeForm.is_active));

            // Keep existing image_url if no new file
            formData.append('image_url', prizeForm.image_url || '');

            if (prizeForm.file) {
                formData.append('file', prizeForm.file);
            }

            const res = await fetch('/api/admin/prizes', {
                method,
                // Do NOT set Content-Type header for FormData, browser sets it with boundary
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                if (editingPrize) {
                    setPrizes(prev => prev.map(p => p.id === editingPrize.id ? data : p));
                } else {
                    setPrizes(prev => [data, ...prev]);
                }
                setIsPrizeModalOpen(false);
                setEditingPrize(null);
            } else {
                alert(data.error || 'Ошибка при сохранении');
            }
        } catch (e) {
            console.error(e);
            alert('Ошибка сети');
        }
    };

    const handlePrintSelected = async () => {
        if (selectedIds.size === 0) {
            alert("Выберите QR-коды для печати.");
            return;
        }

        const selectedLinksToPrint = links.filter(link => selectedIds.has(link.id));

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Не удалось открыть окно печати. Разрешите всплывающие окна.");
            return;
        }

        // Duplicate links based on printCopies
        const expandedLinks: ShortLink[] = [];
        selectedLinksToPrint.forEach(link => {
            for (let i = 0; i < printCopies; i++) {
                expandedLinks.push(link);
            }
        });

        // Chunk into pages of 24 (3 cols * 8 rows)
        const PAGESIZE = 24;
        const pages = [];
        for (let i = 0; i < expandedLinks.length; i += PAGESIZE) {
            pages.push(expandedLinks.slice(i, i + PAGESIZE));
        }

        let fullHtml = '';
        for (const pageItems of pages) {
            let stickersHtml = '';
            for (const link of pageItems) {
                const shortUrl = `${window.location.protocol}//${window.location.host}/s/${link.code}`;
                try {
                    const qrData = await QRCodeLib.toDataURL(shortUrl, {
                        width: 200,
                        margin: 2,
                        color: { dark: '#000000', light: '#ffffff' }
                    });

                    stickersHtml += `
                        <div class="sticker">
                            <div class="sticker-inner">
                                <div class="qr-box">
                                    <img src="${qrData}" alt="QR" />
                                </div>
                                <div class="content-box">
                                    <h1 class="main-title">
                                        <svg class="tg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
                                        </svg>
                                        ${link.sticker_title || stickerSettings.mainTitle}
                                    </h1>
                                    <div class="features">
                                    ${link.sticker_features || stickerSettings.featuresTitle}
                                    </div>
                                    <div class="prizes">
                                        ${link.sticker_prizes || stickerSettings.prizesList}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                } catch (err) {
                    console.error(`Failed to generate QR for ${link.code}`, err);
                }
            }
            fullHtml += `<div class="page">${stickersHtml}</div>`;
        }

        // Update statuses after printing
        for (const link of selectedLinksToPrint) {
            handleUpdateStatus(link.code, link.id, 'распечатан');
        }
        setSelectedIds(new Set());

        printWindow.document.write(`
            <html>
            <head>
                <title>Печать наклеек A4 (70x37mm)</title>
                <style>
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: white;
                        color: black;
                        -webkit-print-color-adjust: exact;
                    }
                    .page {
                        width: 210mm;
                        height: 297mm;
                        display: grid;
                        grid-template-columns: repeat(3, 70mm);
                        grid-template-rows: repeat(8, 37.125mm); /* 297/8 = 37.125 */
                        position: relative;
                        overflow: hidden;
                        page-break-after: always;
                    }
                    .sticker {
                        box-sizing: border-box;
                        width: 70mm;
                        height: 37mm;
                        padding: 4mm 2mm;
                        overflow: hidden;
                    }
                    .sticker-inner {
                        display: flex;
                        gap: 2mm;
                        height: 100%;
                        align-items: center;
                    }
                    .qr-box {
                        width: 25mm;
                        flex-shrink: 0;
                    }
                    .qr-box img {
                        width: 100%;
                        height: auto;
                        display: block;
                    }
                    .content-box {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        text-align: left;
                    }
                    .main-title {
                        margin: 0;
                        padding: 0;
                        font-size: 15px; /* Maximized */
                        font-weight: 900;
                        line-height: 1;
                        text-transform: uppercase;
                        margin-bottom: 1mm; /* Reduced spacing */
                        white-space: nowrap;
                        display: flex;
                        align-items: center;
                        gap: 1mm;
                        padding-left: 1mm; /* Indent */
                    }
                    .tg-icon {
                        width: 4.5mm;
                        height: 4.5mm;
                        flex-shrink: 0;
                    }
                    .features {
                        font-size: 11px; /* Maximized */
                        font-weight: 700;
                        color: #000;
                        background: #eee;
                        padding: 0.5mm 1.5mm;
                        border-radius: 2mm;
                        width: fit-content;
                        margin-bottom: 0.5mm; /* Reduce gap to prizes */
                        margin-left: 1mm; /* Indent */
                        text-transform: uppercase;
                    }
                    .cta {
                        font-size: 8px;
                        font-weight: 600;
                        color: #555;
                        margin-bottom: 0.5mm;
                        text-transform: uppercase;
                    }
                    .prizes {
                        font-family: 'Arial Black', Gadget, sans-serif;
                        font-size: 13px;
                        font-weight: 900;
                        color: black;
                        text-transform: uppercase;
                        margin-top: 1mm; /* Tighten up */
                        margin-left: 1mm; /* Indent */
                        line-height: 1;
                    }
                    @media print {
                        .no-print { display: none; }
                        .sticker { border: none; }
                        .features { -webkit-print-color-adjust: exact; background: #eee; }
                    }
                </style>
            </head>
            <body>
                ${fullHtml}
                <script>
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                            // window.close(); // Optional: user may want to re-print
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };


    const handleAddToQueue = async () => {
        const lines = batchInput.split("\n").filter(l => l.trim());
        if (lines.length === 0) return;

        const batch = lines.map(line => {
            const [title, district] = line.split("|").map(s => s.trim());
            return { title: title || line.trim(), district: district || "" };
        });

        setBatchLoading(true);
        try {
            const res = await fetch("/api/queue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ batch, intervalMinutes: batchInterval })
            });

            if (!res.ok) throw new Error("Failed to add to queue");

            alert(`Добавлено в очередь: ${batch.length} чатов`);
            setBatchInput("");
            fetchQueue();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setBatchLoading(false);
        }
    };





    const handleUpdateTarget = async (code: string, id: number) => {
        if (!editingTarget) return;
        try {
            const res = await fetch(`/api/links/${code}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUrl: editingTarget.value })
            });
            if (!res.ok) throw new Error("Failed to update");
            setLinks(prev => prev.map(l => l.id === id ? { ...l, target_url: editingTarget.value } : l));
            setEditingTarget(null);
        } catch (e: any) {
            alert(e.message);
        }
    };



    const handleDisconnect = async (code: string, id: number) => {
        if (!confirm('Отвязать эту ссылку от группы?')) return;
        try {
            const res = await fetch(`/api/links/${code}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tgChatId: null })
            });
            if (!res.ok) throw new Error("Failed to disconnect");

            setLinks(prev => prev.map(l => l.id === id ? {
                ...l,
                tg_chat_id: undefined,
                reviewer_name: undefined,
                member_count: 0
            } : l));
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDeleteQueueItem = async (id: number) => {
        if (!confirm('Удалить этот чат из очереди?')) return;
        try {
            const res = await fetch('/api/queue', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                setQueue(prev => prev.filter(q => q.id !== id));
            }
        } catch (e) {
            alert('Ошибка при удалении');
        }
    };

    const handleProcessQueue = async () => {
        setBatchLoading(true);
        try {
            const res = await fetch("/api/queue/process?force=true");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to process");

            if (data.success) {
                alert(`Процесс запущен: создан чат ${data.chatId || ""}`);
            } else {
                alert(data.message || "Очередь пуста или нет задач к выполнению");
            }
            fetchQueue();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setBatchLoading(false);
        }
    };

    const handleUpdateQueueItem = async (item: QueueItem) => {
        try {
            const res = await fetch('/api/queue', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            if (res.ok) {
                setQueue(prev => prev.map(q => q.id === item.id ? item : q));
                setEditingQueueItem(null);
            }
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleRefreshData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/data');
            if (res.ok) {
                const data = await res.json();
                setLinks(data.links);
                setEcosystems(data.ecosystems);
            }
        } catch (e) {
            console.error("Refresh failed", e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStuck = async (tgChatId: string, currentState: boolean, codes: string[]) => {
        const newState = !currentState;
        try {
            // Use explicit codes if provided, otherwise filter
            const targetCodes = codes && codes.length > 0 ? codes : links.filter(l => l.tg_chat_id === tgChatId).map(l => l.code);

            await Promise.all(targetCodes.map(code =>
                fetch(`/api/links/${code}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isStuck: newState })
                })
            ));

            setLinks(prev => prev.map(l => l.tg_chat_id === tgChatId ? { ...l, is_stuck: newState } : l));
            // FIXED: Update Ecosystems state too so the checkbox reflects change immediately
            setEcosystems(prev => prev.map(e => e.tg_chat_id === tgChatId ? { ...e, is_stuck: newState } : e));
        } catch (e: any) {
            alert('Ошибка при обновлении статуса');
        }
    };

    const handleEcosystemStatusChange = async (tgChatId: string, codes: string[], newStatus: string) => {
        try {
            // Use explicit codes if provided, otherwise filter
            const targetCodes = codes && codes.length > 0 ? codes : links.filter(l => l.tg_chat_id === tgChatId).map(l => l.code);

            await Promise.all(targetCodes.map(code =>
                fetch(`/api/links/${code}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                })
            ));

            // Also invoke API to update the ecosystem record status explicitly if present
            await fetch('/api/ecosystems', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tgChatId, status: newStatus })
            });

            setLinks(prev => prev.map(l => l.tg_chat_id === tgChatId ? { ...l, status: newStatus } : l));
            // FIXED: Update Ecosystems state too so the status dropdown reflects change immediately
            setEcosystems(prev => prev.map(e => e.tg_chat_id === tgChatId ? { ...e, status: newStatus } : e));
        } catch (e: any) {
            alert('Ошибка при обновлении статуса экосистемы');
        }
    };

    const handleUpdateStatus = async (code: string, id: number, newStatus: string) => {
        try {
            const res = await fetch(`/api/links/${code}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error("Failed to update status");
            setLinks(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleUpdateGroup = async (code: string, id: number) => {
        if (!editingGroup) return;
        try {
            // 1. Update DB (local link data)
            const res = await fetch(`/api/links/${code}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tgChatId: editingGroup.tgChatId,
                    title: editingGroup.title,
                    district: editingGroup.district
                })
            });
            if (res.ok) {
                setLinks(prev => prev.map(l => l.id === id ? {
                    ...l,
                    tg_chat_id: editingGroup.tgChatId,
                    reviewer_name: editingGroup.title, // reviewer_name used as title
                    district: editingGroup.district
                } : l));

                // 2. Enqueue Telegram Update (if title changed and Telegram ID exists)
                // We check if tgChatId is present to know it's a real chat
                // Ideally we should check if title *actually* changed, but enforcing update is safer.
                if (editingGroup.tgChatId && editingGroup.title) {
                    await fetch('/api/topic-queue/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chatIds: [editingGroup.tgChatId],
                            action: 'update_title',
                            title: editingGroup.title
                        })
                    });
                    // We don't block UI on this, let it run in background
                }

                setEditingGroup(null);
            } else {
                alert("Ошибка сохранения");
            }
        } catch (e) {
            alert("Ошибка сохранения");
        }
    };

    const handleBulkUpdateStatus = async (newStatus: string) => {
        if (selectedIds.size === 0 || !newStatus) return;
        if (!confirm(`Изменить статус для ${selectedIds.size} элементов на "${newStatus}" ? `)) return;

        setLoading(true);
        const selectedLinks = links.filter(l => selectedIds.has(l.id));

        try {
            await Promise.all(selectedLinks.map(link =>
                fetch(`/api/links/${link.code}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                })
            ));

            setLinks(prev => prev.map(l =>
                selectedIds.has(l.id) ? { ...l, status: newStatus } : l
            ));

            alert('Статусы обновлены');
            setSelectedIds(new Set());
        } catch (e: any) {
            alert('Ошибка при массовом обновлении: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlinkEcosystem = async (tgChatId: string, codes: string[]) => {
        if (!confirm('Отвязать все QR-коды от этой группы? Сами ссылки останутся.')) return;
        try {
            await Promise.all(codes.map(code =>
                fetch(`/api/links/${code}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tgChatId: null })
                })
            ));
            setLinks(prev => prev.map(l => l.tg_chat_id === tgChatId ? {
                ...l,
                tg_chat_id: undefined,
                reviewer_name: undefined,
                member_count: 0,
                status: 'не подключен'
            } : l));
        } catch (e: any) {
            alert('Ошибка при отвязке экосистемы');
        }
    };

    const handleUnlinkLink = async (code: string, id: number) => {
        if (!confirm('Отвязать QR-код от группы? Он вернется в статус "Новая точка".')) return;
        try {
            const res = await fetch(`/api/links/${code}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tgChatId: null })
            });

            if (res.ok) {
                setLinks(prev => prev.map(l => l.id === id ? {
                    ...l,
                    tg_chat_id: undefined,
                    reviewer_name: undefined,
                    member_count: 0,
                    status: 'не подключен',
                    target_url: ''
                } : l));
            } else {
                alert('Ошибка при отвязке');
            }
        } catch (e) {
            alert('Ошибка сервера');
        }
    };

    const handleDeleteLink = async (id: number, code: string) => {
        if (!confirm('Вы уверены, что хотите удалить эту ссылку?')) return;
        try {
            const res = await fetch('/api/shorten', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                setLinks(prev => prev.filter(l => l.id !== id));
                if (result?.link.includes(`/ s / ${code}`)) {
                    setResult(null);
                }
            } else {
                alert('Ошибка при удалении');
            }
        } catch (e) {
            alert('Ошибка при удалении');
        }
    };



    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text || '');
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="w-full max-w-6xl space-y-12" >

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4" >
                <div className="flex gap-4 p-1.5 bg-slate-900/50 border border-white/10 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('qr_batch')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'qr_batch'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            } `}
                    >
                        <QrCode className="w-4 h-4" />
                        QR Генератор
                    </button>

                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'stats'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            } `}
                    >
                        <BarChartIcon className="w-4 h-4" />
                        Статистика
                    </button>
                    <button
                        onClick={() => setActiveTab('prizes')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'prizes'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Gift className="w-4 h-4" />
                        Призы
                    </button>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Поиск по коду, адресу или району..."
                            className="w-full h-12 bg-slate-900/50 border border-white/10 rounded-xl pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white flex items-center gap-2 transition-all shadow-xl shadow-indigo-500/20 whitespace-nowrap"
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span className="hidden md:inline">Создать чат</span>
                    </button>
                </div>
            </div >

            {activeTab === 'ecosystem' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Create Modal */}
                    {showCreateModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                            <MessageSquare className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div className="text-left">
                                            <h2 className="text-xl font-semibold text-white">Создание экосистемы</h2>
                                            <p className="text-sm text-slate-400">Введите адрес дома для создания чата</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmit(async (data) => {
                                        await onSubmit(data);
                                        setShowCreateModal(false);
                                    })} className="space-y-4">
                                        <div className="relative">
                                            <input
                                                {...register("title", { required: "Адрес дома обязателен" })}
                                                placeholder="Напр: ул. Пушкина, д. 10"
                                                className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-6 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 text-white"
                                            />
                                            {errors.title && (
                                                <p className="text-red-400 text-xs mt-1 ml-2">{errors.title.message}</p>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <input
                                                {...register("district")}
                                                placeholder="Район (напр: Хамовники)"
                                                className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-6 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 text-white"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-500/20 text-white"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5" />
                                                    ⚡ Создать экосистему
                                                </>
                                            )}
                                        </button>

                                        {error && (
                                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                                {error}
                                            </div>
                                        )}
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Result Block */}
                    {result && (
                        <div className="p-8 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                <div className="p-4 bg-white rounded-2xl">
                                    <QrCodeDisplay value={result.link} size={180} />
                                </div>
                                <div className="flex-1 text-left space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-semibold text-slate-400">Очередь создания ({queue.length})</h3>
                                            <button
                                                onClick={handleProcessQueue}
                                                disabled={batchLoading}
                                                className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs rounded-lg transition-all flex items-center gap-2"
                                            >
                                                {batchLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                                Обработать сейчас
                                            </button>
                                        </div>
                                        {countdown && (
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-4 bg-slate-900/50 rounded-lg px-2 py-1 w-fit">
                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                                                Следующий чат ({nextTask?.title?.split(',')[0]}...): <span className="text-indigo-400 font-mono">{countdown}</span>
                                            </div>
                                        )}
                                        <p className="text-slate-400">Чат "{result.title}" успешно создан.</p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <a
                                            href={result.link}
                                            target="_blank"
                                            className="px-6 h-12 bg-white text-slate-900 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-100 transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Открыть чат
                                        </a>
                                        <button
                                            onClick={() => downloadQR(result.link, result.title)}
                                            className="px-6 h-12 bg-slate-800 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-700 transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Скачать QR
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* History Table */}
                    {filteredEcosystems.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <HistoryIcon className="w-4 h-4" />
                                    <h3 className="text-sm font-medium uppercase tracking-wider">История созданных чатов</h3>
                                </div>
                                <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-tighter shrink-0">
                                    <button
                                        onClick={handleRefreshData}
                                        disabled={loading}
                                        className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1"
                                        title="Обновить данные"
                                    >
                                        <HistoryIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        onClick={() => setStuckFilter('all')}
                                        className={`px-3 py-1.5 rounded-lg transition-all ${stuckFilter === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Все
                                    </button>
                                    <button
                                        onClick={() => setStuckFilter('stuck')}
                                        className={`px-3 py-1.5 rounded-lg transition-all ${stuckFilter === 'stuck' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Оклеены
                                    </button>
                                    <button
                                        onClick={() => setStuckFilter('not_stuck')}
                                        className={`px-3 py-1.5 rounded-lg transition-all ${stuckFilter === 'not_stuck' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Не оклеены
                                    </button>
                                </div>

                                <div className="flex flex-1 items-center gap-2">
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                        <input
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Поиск по коду/адресу..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500/50 text-white"
                                        />
                                    </div>

                                    <div className="relative w-48 group">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                        <input
                                            value={groupSearchTerm}
                                            onChange={(e) => setGroupSearchTerm(e.target.value)}
                                            placeholder="По Группе..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500/50 text-white"
                                        />
                                    </div>

                                    <div className="relative shrink-0">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value as any)}
                                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider outline-none cursor-pointer hover:bg-white/10"
                                        >
                                            <option value="all" className="bg-slate-900">СТАТУС: ЛЮБОЙ</option>
                                            <option value="активен" className="bg-slate-900">АКТИВЕН</option>
                                            <option value="распечатан" className="bg-slate-900">РАСПЕЧАТАН</option>
                                            <option value="приклеен" className="bg-slate-900">ПРИКЛЕЕН</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            {/* Ecosystems Table */}
                            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm shadow-2xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            <th className="p-5 w-14 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedGroupIds.size === paginatedEcosystems.length && paginatedEcosystems.length > 0}
                                                    onChange={handleSelectAllGroups}
                                                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 checked:bg-indigo-500 transition-colors cursor-pointer"
                                                />
                                            </th>
                                            <th className="p-5">Код / Экосистема</th>
                                            <th className="p-5">Статистика</th>
                                            <th className="p-5 text-right">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {paginatedEcosystems.map((item: any) => (
                                            <tr key={item.tg_chat_id} className={`group hover:bg-slate-800/30 transition-all ${selectedGroupIds.has(item.tg_chat_id) ? 'bg-indigo-500/5' : ''}`}>
                                                <td className="p-5 text-center align-top pt-6">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedGroupIds.has(item.tg_chat_id)}
                                                        onChange={() => handleToggleGroupSelect(item.tg_chat_id)}
                                                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 checked:bg-indigo-500 transition-colors cursor-pointer"
                                                    />
                                                </td>
                                                <td className="p-5 align-top">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (!confirm(`Создать топик с игрой в "${item.title}"?`)) return;

                                                                    try {
                                                                        const res = await fetch("/api/admin/create-topic-promo", {
                                                                            method: "POST",
                                                                            headers: { "Content-Type": "application/json" },
                                                                            body: JSON.stringify({ chatId: item.tg_chat_id })
                                                                        });
                                                                        const data = await res.json();
                                                                        if (res.ok) {
                                                                            alert(`Игра создана! Топик: ${data.threadId}\n\nСсылка на приложение:\n${data.appLink}`);
                                                                        } else {
                                                                            alert("Ошибка: " + data.error);
                                                                        }
                                                                    } catch (err) {
                                                                        alert("Ошибка сети");
                                                                    }
                                                                }}
                                                                className="p-1.5 hover:bg-yellow-500/20 text-yellow-500 rounded-lg transition-colors"
                                                                title="Создать игру"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="11" x2="10" y2="11" /><line x1="8" y1="9" x2="8" y2="13" /><rect width="22" height="14" x="1" y="6" rx="2" ry="2" /><path d="M9 1l2 2 3.5-3.5" /><path d="M15 12h.01" /><path d="M18 11h.01" /></svg>
                                                            </button>
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (!confirm(`Заблокировать (закрыть) топики "Услуги" и "Колесо" в "${item.title}"?`)) return;

                                                                    try {
                                                                        const res = await fetch("/api/queue", {
                                                                            method: "POST",
                                                                            headers: { "Content-Type": "application/json" },
                                                                            body: JSON.stringify({
                                                                                type: 'block_topics',
                                                                                payload: { chat_id: item.tg_chat_id },
                                                                                status: 'pending',
                                                                                scheduled_at: new Date().toISOString()
                                                                            })
                                                                        });

                                                                        if (res.ok) {
                                                                            alert(`Задача на блокировку добавлена в очередь!`);
                                                                            // Trigger process immediately for better UX
                                                                            fetch("/api/queue/process?force=true").catch(console.error);
                                                                        } else {
                                                                            alert("Ошибка при добавлении задачи");
                                                                        }
                                                                    } catch (err) {
                                                                        alert("Ошибка сети");
                                                                    }
                                                                }}
                                                                className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                                title="Заблокировать топики (Read-Only)"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingGroup(item);
                                                                }}
                                                                className="opacity-0 group-hover/title:opacity-100 p-1.5 hover:bg-slate-800 text-slate-500 hover:text-indigo-400 rounded-lg transition-all"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                            {item.codes.map((code: string) => (
                                                                <div key={code} className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => copyToClipboard(`https://aporto.tech/s/${code}`, `e-${code}`)}
                                                                        className="px-2 py-1 bg-slate-800 rounded-lg text-xs font-mono font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1.5 border border-transparent hover:border-slate-600"
                                                                    >
                                                                        {code}
                                                                        {copiedId === `e-${code}` ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <ClipboardIcon className="w-3 h-3 opacity-50" />}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUnlinkCode(code, item.title, item.tg_chat_id)}
                                                                        className="p-1 hover:bg-red-500/20 text-slate-600 hover:text-red-400 rounded-md transition-colors"
                                                                        title="Отвязать код"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (!confirm(`Удалить системные сообщения в чате "${item.title}"?`)) return;

                                                                    try {
                                                                        const res = await fetch("/api/queue", {
                                                                            method: "POST",
                                                                            headers: { "Content-Type": "application/json" },
                                                                            body: JSON.stringify({
                                                                                type: 'clean_system_messages',
                                                                                payload: { chat_id: item.tg_chat_id },
                                                                                status: 'pending',
                                                                                scheduled_at: new Date().toISOString()
                                                                            })
                                                                        });

                                                                        if (res.ok) {
                                                                            alert(`Задача на очистку добавлена!`);
                                                                            fetch("/api/queue/process?force=true").catch(console.error);
                                                                        } else {
                                                                            alert("Ошибка при добавлении задачи");
                                                                        }
                                                                    } catch (err) {
                                                                        alert("Ошибка сети");
                                                                    }
                                                                }}
                                                                className="p-1.5 hover:bg-orange-500/20 text-orange-400 rounded-lg transition-colors"
                                                                title="Очистить системные сообщения"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                            </button>
                                                        </div>

                                                        {editingGroup && editingGroup.tgChatId === item.tg_chat_id ? (
                                                            <div className="space-y-3 bg-slate-800 p-4 rounded-2xl border border-indigo-500/30 shadow-lg mt-2">
                                                                <input
                                                                    value={editingGroup.title}
                                                                    onChange={(e) => editingGroup && setEditingGroup({ ...editingGroup, title: e.target.value })}
                                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none text-white focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-600"
                                                                    placeholder="Название"
                                                                />
                                                                <input
                                                                    value={editingGroup.district}
                                                                    onChange={(e) => editingGroup && setEditingGroup({ ...editingGroup, district: e.target.value })}
                                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none text-white focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-600"
                                                                    placeholder="Район"
                                                                />
                                                                <div className="flex gap-2 pt-1">
                                                                    <button
                                                                        onClick={() => handleUpdateEcosystem(item.tg_chat_id)}
                                                                        className="flex-1 py-2 bg-indigo-600 text-xs font-bold rounded-xl text-white hover:bg-indigo-500 transition-colors shadow-md"
                                                                    >
                                                                        Сохранить
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setEditingGroup(null)}
                                                                        className="py-2 px-4 bg-slate-700 text-xs font-bold rounded-xl text-slate-300 hover:bg-slate-600 transition-colors"
                                                                    >
                                                                        Отмена
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-1">
                                                                <div className="flex items-center gap-2 group/title">
                                                                    <h3 className="font-semibold text-base text-white">{item.title}</h3>
                                                                    <button
                                                                        onClick={() => setEditingGroup({
                                                                            tgChatId: item.tg_chat_id,
                                                                            title: item.title,
                                                                            district: item.district
                                                                        })}
                                                                        className="opacity-0 group-hover/title:opacity-100 p-1.5 hover:bg-slate-800 text-slate-500 hover:text-indigo-400 rounded-lg transition-all"
                                                                    >
                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                                                    <MapPin className="w-3.5 h-3.5" />
                                                                    {item.district || 'Район не указан'}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-5 align-top">
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex gap-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Клики</span>
                                                                <span className="text-base font-bold text-slate-200">{item.clicks_count}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Люди</span>
                                                                <span className="text-base font-bold text-slate-200">{item.member_count}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={item.status || 'не подключен'}
                                                                onChange={(e) => handleEcosystemStatusChange(item.tg_chat_id, item.codes, e.target.value)}
                                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border appearance-none cursor-pointer outline-none ${item.status === 'подключен'
                                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                                    : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                                                                    }`}
                                                            >
                                                                <option value="активен" className="bg-slate-900 text-slate-400">АКТИВЕН</option>
                                                                <option value="не подключен" className="bg-slate-900 text-slate-400">НЕ ПОДКЛЮЧЕН</option>
                                                                <option value="подключен" className="bg-slate-900 text-emerald-400">ПОДКЛЮЧЕН</option>
                                                                <option value="не распечатан" className="bg-slate-900 text-slate-400">НЕ РАСПЕЧАТАН</option>
                                                                <option value="распечатан" className="bg-slate-900 text-slate-400">РАСПЕЧАТАН</option>
                                                                <option value="приклеен" className="bg-slate-900 text-indigo-400">ОКЛЕЕН</option>
                                                            </select>

                                                            {item.is_stuck && (
                                                                <div className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                                    ОКЛЕЕН
                                                                </div>
                                                            )}

                                                            <button
                                                                onClick={() => handleRefreshStats(item.codes[0], item.id)}
                                                                className={`p-1 hover:bg-slate-800 rounded-lg transition-all ml-auto ${refreshingId === item.id ? 'animate-spin text-indigo-400' : 'text-slate-600 hover:text-indigo-400'}`}
                                                                title="Обновить статистику"
                                                            >
                                                                <HistoryIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5 align-top">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleToggleStuck(item.tg_chat_id, !!item.is_stuck, item.codes)}
                                                            className={`p-2.5 rounded-xl transition-all border ${item.is_stuck
                                                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-sm'
                                                                : 'border-transparent hover:bg-slate-800 text-slate-400 hover:text-indigo-400'
                                                                }`}
                                                            title={item.is_stuck ? "Снять метку оклеен" : "Отметить оклеенным"}
                                                        >
                                                            <CheckCircle2 className={`w-5 h-5 ${item.is_stuck ? 'fill-indigo-500/20' : ''}`} />
                                                        </button>
                                                        <a
                                                            href={links.find(l => l.tg_chat_id === item.tg_chat_id)?.target_url}
                                                            target="_blank"
                                                            className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all border border-transparent"
                                                            title="Открыть в Telegram"
                                                        >
                                                            <ExternalLink className="w-5 h-5" />
                                                        </a>
                                                        <button
                                                            onClick={() => handleDeleteEcosystem(item.tg_chat_id, item.codes)}
                                                            className="p-2.5 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 transition-all border border-transparent"
                                                            title="Удалить экосистему"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-2 pt-4 border-t border-white/5">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                        Страница <span className="text-white">{currentPage}</span> из <span className="text-white">{totalPages}</span>
                                        <span className="ml-2 text-slate-600">({filteredEcosystems.length} всего)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            ) : activeTab === 'stats' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <StatisticsTab />
                </div>
            ) : activeTab === 'prizes' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-2xl font-bold text-white">Управление Призами</h2>
                        <button
                            onClick={() => {
                                setEditingPrize(null);
                                setPrizeForm({
                                    name: '',
                                    type: 'points',
                                    value: '',
                                    probability: 0,
                                    quantity: -1,
                                    image_url: '',
                                    description: '',
                                    is_active: true,
                                    file: null
                                });
                                setIsPrizeModalOpen(true);
                            }}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white flex items-center gap-2 transition-all shadow-xl shadow-indigo-500/20 whitespace-nowrap"
                        >
                            <Gift className="w-5 h-5" />
                            Создать приз
                        </button>
                    </div>

                    {prizes.length === 0 ? (
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl text-center space-y-4">
                            <Gift className="w-16 h-16 text-slate-500 mx-auto" />
                            <h3 className="text-xl font-semibold text-white">Призы пока не созданы</h3>
                            <p className="text-slate-400">Нажмите "Создать приз", чтобы добавить первый приз для розыгрыша.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        <th className="p-5">Название</th>
                                        <th className="p-5">Тип</th>
                                        <th className="p-5">Значение</th>
                                        <th className="p-5">Вероятность</th>
                                        <th className="p-5">Количество</th>
                                        <th className="p-5">Активен</th>
                                        <th className="p-5 text-right">Действия</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {prizes.map((prize) => (
                                        <tr key={prize.id} className="group hover:bg-slate-800/30 transition-all">
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    {prize.image_url ? (
                                                        <img
                                                            src={prize.image_url}
                                                            alt={prize.name}
                                                            className="w-10 h-10 object-cover rounded-lg bg-slate-800"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className={`w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center ${prize.image_url ? 'hidden' : ''}`}>
                                                        <Gift className="w-5 h-5 text-slate-500" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-white">{prize.name}</span>
                                                        {prize.description && <span className="text-xs text-slate-500 line-clamp-1">{prize.description}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                    {(() => {
                                                        switch (prize.type) {
                                                            case 'points': return '🪙 Монетки';
                                                            case 'tokens':
                                                            case 'balance': return '🎫 Токены Aporto';
                                                            case 'item': return '📦 Предмет';
                                                            case 'coupon': return '🎟️ Купон';
                                                            default: return prize.type;
                                                        }
                                                    })()}
                                                </span>
                                            </td>
                                            <td className="p-5 text-white">{prize.value}</td>
                                            <td className="p-5 text-white">{prize.probability}%</td>
                                            <td className="p-5 text-white">{prize.quantity === null || prize.quantity === -1 ? '∞' : prize.quantity}</td>
                                            <td className="p-5">
                                                {prize.is_active ? (
                                                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Да</span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">Нет</span>
                                                )}
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingPrize(prize);
                                                            setPrizeForm({
                                                                name: prize.name,
                                                                type: prize.type,
                                                                value: prize.value,
                                                                probability: prize.probability,
                                                                quantity: prize.quantity === null ? -1 : prize.quantity,
                                                                image_url: prize.image_url,
                                                                description: prize.description,
                                                                is_active: prize.is_active,
                                                                file: null
                                                            });
                                                            setIsPrizeModalOpen(true);
                                                        }}
                                                        className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 transition-all border border-transparent"
                                                        title="Редактировать приз"
                                                    >
                                                        <Edit3 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm(`Вы уверены, что хотите удалить приз "${prize.name}"?`)) return;
                                                            try {
                                                                const res = await fetch(`/api/admin/prizes?id=${prize.id}`, {
                                                                    method: 'DELETE'
                                                                });
                                                                if (res.ok) {
                                                                    setPrizes(prev => prev.filter(p => p.id !== prize.id));
                                                                } else {
                                                                    alert('Ошибка при удалении');
                                                                }
                                                            } catch (e) {
                                                                console.error(e);
                                                                alert('Ошибка сети');
                                                            }
                                                        }}
                                                        className="p-2.5 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 transition-all border border-transparent"
                                                        title="Удалить приз"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                        <div className="flex flex-col lg:flex-row gap-12">
                            {/* Editor Section */}
                            <div className="flex-1 space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-white">Редактор Наклейки</h2>
                                    <p className="text-slate-400 text-sm">Настройте текст, который будет печататься на наклейках.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500 pl-1">Target Link (для метрики)</label>
                                        <input
                                            value={stickerSettings.targetUrl}
                                            onChange={(e) => setStickerSettings({ ...stickerSettings, targetUrl: e.target.value })}
                                            placeholder="https://t.me/MyBot"
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                    {/* UTM Toggle */}
                                    <div className="flex items-center gap-2 pl-1">
                                        <input
                                            type="checkbox"
                                            id="useUtm"
                                            checked={stickerSettings.useUtm}
                                            onChange={(e) => setStickerSettings({ ...stickerSettings, useUtm: e.target.checked })}
                                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="useUtm" className="text-sm text-slate-400 select-none cursor-pointer">
                                            Автоматически добавлять UTM метки (source, medium, campaign)
                                        </label>
                                    </div>
                                </div>

                                <div className="h-px bg-white/10 my-4" />

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Заголовок</label>
                                        <input
                                            value={stickerSettings.mainTitle}
                                            onChange={(e) => setStickerSettings({ ...stickerSettings, mainTitle: e.target.value })}
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            placeholder="ЧАТ СОСЕДЕЙ🏠"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Подзаголовок (Фичи)</label>
                                        <input
                                            value={stickerSettings.featuresTitle}
                                            onChange={(e) => setStickerSettings({ ...stickerSettings, featuresTitle: e.target.value })}
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            placeholder="КОЛЕСО ПРИЗОВ:"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Список призов</label>
                                        <textarea
                                            value={stickerSettings.prizesList}
                                            onChange={(e) => setStickerSettings({ ...stickerSettings, prizesList: e.target.value })}
                                            className="w-full h-24 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                                            placeholder="WB/OZON/iPhone"
                                        />
                                        <p className="text-[10px] text-slate-500">Используйте / для разделения или переноса строк</p>
                                    </div>
                                </div>
                            </div>

                            {/* Preview Section */}
                            <div className="flex-1 space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-xl font-bold text-white">Предпросмотр</h2>
                                    <p className="text-slate-400 text-sm">Так будет выглядеть наклейка при печати.</p>
                                </div>

                                <div className="p-8 bg-slate-900/50 rounded-3xl border border-white/5 flex items-center justify-center min-h-[300px]">
                                    {/* Component Preview Container */}
                                    <div className="sticker-preview-container transform scale-100 origin-center transition-transform hover:scale-105">
                                        <div className="sticker shadow-xl">
                                            <div className="sticker-inner">
                                                <div className="qr-box bg-slate-100">
                                                    <QrCode className="w-16 h-16 text-slate-800 opacity-20" />
                                                </div>
                                                <div className="content-box">
                                                    <h1 className="main-title text-slate-900">
                                                        <svg className="tg-icon text-[#0088cc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
                                                        </svg>
                                                        {stickerSettings.mainTitle}
                                                    </h1>
                                                    <div className="features text-slate-800">
                                                        {stickerSettings.featuresTitle}
                                                    </div>
                                                    <div className="prizes text-slate-600">
                                                        {stickerSettings.prizesList}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    {selectedIds.size > 0 ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="text-xs font-bold uppercase text-slate-500">Копий каждого:</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={printCopies}
                                                    onChange={(e) => setPrintCopies(Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="w-16 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-center text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <button
                                                onClick={handlePrintSelected}
                                                className="px-8 py-4 bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold inline-flex items-center gap-3 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                                            >
                                                <Printer className="w-5 h-5" />
                                                Распечатать выбранные ({selectedIds.size * printCopies} шт)
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleTargetedBatchGenerate}
                                            disabled={batchLoading}
                                            className="px-8 py-4 bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold inline-flex items-center gap-3 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Создать QR-код
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>


                    </div>





                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2 text-slate-400">
                                <QrCode className="w-4 h-4" />
                                <h3 className="text-sm font-medium uppercase tracking-wider">База всех ссылок</h3>
                            </div>

                            <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-tighter shrink-0">
                                <button
                                    onClick={() => setStuckFilter('all')}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${stuckFilter === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Все
                                </button>
                                <button
                                    onClick={() => setStuckFilter('stuck')}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${stuckFilter === 'stuck' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Оклеены
                                </button>
                                <button
                                    onClick={() => setStuckFilter('not_stuck')}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${stuckFilter === 'not_stuck' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Не оклеены
                                </button>
                            </div>

                            <div className="flex flex-1 items-center gap-2 max-w-2xl ml-4">
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Поиск по коду/адресу..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500/50 text-white"
                                    />
                                </div>

                                <div className="relative w-48 group">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        value={groupSearchTerm}
                                        onChange={(e) => setGroupSearchTerm(e.target.value)}
                                        placeholder="По Группе..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500/50 text-white"
                                    />
                                </div>

                                <div className="relative shrink-0">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as any)}
                                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider outline-none cursor-pointer hover:bg-white/10"
                                    >
                                        <option value="all" className="bg-slate-900">СТАТУС: ЛЮБОЙ</option>
                                        <option value="не распечатан" className="bg-slate-900">НЕ РАСПЕЧАТАН</option>
                                        <option value="распечатан" className="bg-slate-900">РАСПЕЧАТАН</option>
                                        <option value="не подключен" className="bg-slate-900">НЕ ПОДКЛЮЧЕН</option>
                                        <option value="подключен" className="bg-slate-900">ПОДКЛЮЧЕН</option>
                                        <option value="активен" className="bg-slate-900">АКТИВЕН</option>
                                        <option value="приклеен" className="bg-slate-900">ПРИКЛЕЕН</option>
                                        <option value="архив" className="bg-slate-900">АРХИВ</option>
                                    </select>
                                </div>
                            </div>

                            <div className="text-xs text-slate-500 uppercase tracking-widest ml-4">
                                Всего: {filteredAllLinks.length}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-slate-500">
                                        <th className="p-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.size === links.length && links.length > 0}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-indigo-500"
                                            />
                                        </th>
                                        <th className="p-4 font-semibold">Код</th>
                                        <th className="p-4 font-semibold">Группа / Привязка</th>
                                        <th className="p-4 font-semibold">Редирект</th>
                                        <th className="p-4 font-semibold text-right">Действие</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedLinks.map((link) => {
                                        const shortUrl = `${window.location.protocol}//${window.location.host}/s/${link.code}`;
                                        return (
                                            <tr key={link.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${selectedIds.has(link.id) ? 'bg-indigo-500/10' : ''}`}>
                                                <td className="p-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(link.id)}
                                                        onChange={() => handleToggleSelect(link.id)}
                                                        className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-indigo-500"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <button
                                                            onClick={() => copyToClipboard(shortUrl, `s-${link.id}`)}
                                                            className="text-white font-mono font-bold text-sm bg-white/5 px-2 py-1 rounded hover:bg-white/10 transition-colors flex items-center gap-2 w-fit"
                                                        >
                                                            {link.code}
                                                            <ExternalLink className={`w-3 h-3 ${copiedId === `s-${link.id}` ? 'text-green-400' : 'text-slate-500'}`} />
                                                        </button>

                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={link.status || 'не распечатан'}
                                                                onChange={(e) => handleUpdateStatus(link.code, link.id, e.target.value)}
                                                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter border bg-transparent outline-none cursor-pointer transition-all ${link.status === 'подключен' ? 'border-green-500/20 text-green-500 bg-green-500/5' :
                                                                    link.status === 'не подключен' ? 'border-orange-500/20 text-orange-400 bg-orange-500/5' :
                                                                        link.status === 'распечатан' ? 'border-blue-500/20 text-blue-400 bg-blue-500/5' :
                                                                            link.status === 'архив' ? 'border-slate-500/20 text-slate-400 bg-slate-500/5' :
                                                                                'border-slate-500/20 text-slate-500 bg-slate-500/5'
                                                                    }`}
                                                            >
                                                                <option value="не распечатан" className="bg-slate-900">не распечатан</option>
                                                                <option value="распечатан" className="bg-slate-900">распечатан</option>
                                                                <option value="не подключен" className="bg-slate-900">не подключен</option>
                                                                <option value="подключен" className="bg-slate-900">подключен</option>
                                                                <option value="архив" className="bg-slate-900">архив</option>
                                                            </select>
                                                        </div>

                                                        <div className="flex gap-2 text-[8px] text-slate-600 uppercase">
                                                            <span>{link.clicks_count || 0} clks</span>
                                                            <span>{link.member_count || 0} subs</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1.5 text-left">
                                                        {editingGroup?.id === link.id ? (
                                                            <div className="space-y-2 p-3 bg-slate-900/50 rounded-xl border border-indigo-500/30">
                                                                <input
                                                                    placeholder="Chat ID (напр: -100...)"
                                                                    value={editingGroup?.tgChatId || ''}
                                                                    onChange={(e) => editingGroup && setEditingGroup({ ...editingGroup, tgChatId: e.target.value })}
                                                                    className="w-full bg-slate-950 border border-white/5 rounded px-2 py-1.5 text-[11px] outline-none text-white"
                                                                />
                                                                <input
                                                                    placeholder="Название группы"
                                                                    value={editingGroup?.title || ''}
                                                                    onChange={(e) => editingGroup && setEditingGroup({ ...editingGroup, title: e.target.value })}
                                                                    className="w-full bg-slate-950 border border-white/5 rounded px-2 py-1.5 text-[11px] outline-none text-white"
                                                                />
                                                                <input
                                                                    placeholder="Район"
                                                                    value={editingGroup?.district || ''}
                                                                    onChange={(e) => editingGroup && setEditingGroup({ ...editingGroup, district: e.target.value })}
                                                                    className="w-full bg-slate-950 border border-white/5 rounded px-2 py-1.5 text-[11px] outline-none text-white"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => handleUpdateGroup(link.code, link.id)} className="flex-1 py-1 px-2 bg-indigo-600 text-white text-[10px] rounded font-bold">Save</button>
                                                                    <button onClick={() => setEditingGroup(null)} className="py-1 px-3 bg-white/5 text-slate-500 text-[10px] rounded">Cancel</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-0.5 max-w-[200px]">
                                                                {link.tg_chat_id ? (
                                                                    <>
                                                                        <div className="text-xs font-semibold text-white truncate">{link.reviewer_name || 'Связанный чат'}</div>
                                                                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                                            <MapPin className="w-2.5 h-2.5" />
                                                                            {link.district || 'Без района'}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <button
                                                                                onClick={() => setEditingGroup({ id: link.id, tgChatId: link.tg_chat_id || '', title: link.reviewer_name || '', district: link.district || '' })}
                                                                                className="text-[9px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                                                                            >
                                                                                <Edit3 className="w-3 h-3" /> Ред.
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleUnlinkLink(link.code, link.id)}
                                                                                className="text-[9px] text-red-500/70 hover:text-red-500 transition-colors flex items-center gap-1"
                                                                                title="Отвязать группу"
                                                                            >
                                                                                <Link2Off className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setEditingGroup({ id: link.id, tgChatId: '', title: '', district: '' })}
                                                                        className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 text-[10px] font-bold hover:bg-indigo-500/20 transition-all flex items-center gap-1.5 w-fit"
                                                                    >
                                                                        <LinkIcon className="w-3 h-3" /> Привязать к группе
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-2 text-left">
                                                        {editingTarget?.id === link.id ? (
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={editingTarget?.value || ''}
                                                                    onChange={(e) => editingTarget && setEditingTarget({ ...editingTarget, value: e.target.value })}
                                                                    className="flex-1 bg-slate-900 border border-indigo-500/50 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-white"
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    onClick={() => handleUpdateTarget(link.code, link.id)}
                                                                    className="px-3 py-1 bg-indigo-600 text-white text-xs rounded font-bold"
                                                                >
                                                                    Save
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 group/target">
                                                                <div className={`text-xs truncate max-w-[200px] ${link.target_url ? 'text-slate-400' : 'text-red-400 italic'}`}>
                                                                    {link.target_url || 'Target не задан'}
                                                                </div>
                                                                <button
                                                                    onClick={() => setEditingTarget({ id: link.id, value: link.target_url || '' })}
                                                                    className="opacity-0 group-hover/target:opacity-100 p-1 hover:bg-white/10 rounded text-slate-500 transition-all"
                                                                >
                                                                    <Edit3 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2 text-slate-500">
                                                        <button
                                                            onClick={() => setPrintModalState({ isOpen: true, link })}
                                                            className="p-2.5 hover:bg-white/10 rounded-xl transition-all"
                                                            title="Печать"
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => downloadQR(shortUrl, `QR_${link.code}`)}
                                                            className="p-2.5 hover:bg-white/10 rounded-xl transition-all"
                                                            title="Скачать QR"
                                                        >
                                                            <QrCode className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteLink(link.id, link.code)}
                                                            className="p-2.5 hover:bg-red-500/10 rounded-xl hover:text-red-500 transition-all"
                                                            title="Удалить"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls for QR Links */}
                        {totalQrPages > 1 && (
                            <div className="flex items-center justify-between px-2 pt-4 border-t border-white/5">
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                    Страница <span className="text-white">{currentPage}</span> из <span className="text-white">{totalQrPages}</span>
                                    <span className="ml-2 text-slate-600">({filteredAllLinks.length} всего)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalQrPages, prev + 1))}
                                        disabled={currentPage === totalQrPages}
                                        className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            )
            }

            {/* Topic Action Modal - Moved to global scope */}
            {
                showTopicModal && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">Управление топиками ({selectedGroupIds.size})</h2>
                                <button onClick={() => setShowTopicModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                            </div>

                            <div className="space-y-4 text-left">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold uppercase text-slate-500 pl-1">Выберите топик</label>
                                    <select
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        value={topicActionData.topicName}
                                        onChange={(e) => setTopicActionData({ ...topicActionData, topicName: e.target.value })}
                                    >
                                        <option value="📢 Новости">📢 Новости</option>
                                        <option value="🗣 Флудилка">🗣 Флудилка</option>
                                        <option value="🛒 Скидки и Промокоды">🛒 Скидки и Промокоды</option>
                                        <option value="🛠 Услуги">🛠 Услуги</option>
                                        <option value="‼️ ВЫБОР АДМИНА">‼️ ВЫБОР АДМИНА</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold uppercase text-slate-500 pl-1">Сообщение (необязательно)</label>
                                    <textarea
                                        className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        placeholder="Введите текст сообщения..."
                                        value={topicActionData.message}
                                        onChange={(e) => setTopicActionData({ ...topicActionData, message: e.target.value })}
                                    />
                                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={topicActionData.pin}
                                            onChange={(e) => setTopicActionData({ ...topicActionData, pin: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-indigo-500"
                                        />
                                        <span className="text-xs text-slate-400">Закрепить сообщение</span>
                                    </label>
                                </div>

                                <div className="flex flex-col gap-1.5 pt-2">
                                    <label className="text-[10px] font-bold uppercase text-slate-500 pl-1">Доступ к топику</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setTopicActionData({ ...topicActionData, closedAction: topicActionData.closedAction === 'close' ? undefined : 'close' })}
                                            className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${topicActionData.closedAction === 'close' ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                        >
                                            Закрыть (Read-Only)
                                        </button>
                                        <button
                                            onClick={() => setTopicActionData({ ...topicActionData, closedAction: topicActionData.closedAction === 'open' ? undefined : 'open' })}
                                            className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${topicActionData.closedAction === 'open' ? 'bg-green-500/20 border-green-500/50 text-green-500' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                        >
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Bulk Actions Fixed Bar */}
            {
                selectedGroupIds.size > 0 && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-4 px-6 py-4 bg-slate-900/90 backdrop-blur border border-white/10 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-tighter">Выбрано групп</span>
                            <span className="text-lg font-black text-white">{selectedGroupIds.size}</span>
                        </div>
                        <div className="w-px h-8 bg-white/10 mx-2" />
                        <button
                            onClick={() => setShowTopicModal(true)}
                            className="h-12 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Управление топиками
                        </button>
                        <button
                            onClick={() => setSelectedGroupIds(new Set())}
                            className="p-3 hover:bg-white/5 text-slate-500 hover:text-white rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )
            }
            {/* Admin Prize Modal */}
            {
                isPrizeModalOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-xl p-8 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">{editingPrize ? 'Редактировать приз' : 'Создать новый приз'}</h2>
                                <button onClick={() => setIsPrizeModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                            </div>

                            <form onSubmit={handleSavePrize} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500 ml-1">Название</label>
                                    <input
                                        required
                                        value={prizeForm.name}
                                        onChange={e => setPrizeForm({ ...prizeForm, name: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder:text-slate-600"
                                        placeholder="Например: Скидка 50%"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500 ml-1">Тип</label>
                                        <select
                                            value={prizeForm.type}
                                            onChange={e => setPrizeForm({ ...prizeForm, type: e.target.value })}
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 text-white appearance-none cursor-pointer"
                                        >
                                            <option value="points">Монетки (для вращения)</option>
                                            <option value="tokens">Токены Aporto (LLM)</option>
                                            <option value="balance">Токены Aporto (LLM)</option>
                                            <option value="item">Предмет (iPhone)</option>
                                            <option value="coupon">Купон/Промо</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500 ml-1">Значение</label>
                                        <input
                                            required
                                            value={prizeForm.value}
                                            onChange={e => setPrizeForm({ ...prizeForm, value: e.target.value })}
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder:text-slate-600"
                                            placeholder="500, PROMO123"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500 ml-1">Вероятность (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={prizeForm.probability}
                                            onChange={e => setPrizeForm({ ...prizeForm, probability: parseFloat(e.target.value) })}
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder:text-slate-600"
                                            placeholder="0.1"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500 ml-1">Количество</label>
                                        <input
                                            type="number"
                                            required
                                            value={prizeForm.quantity}
                                            onChange={e => setPrizeForm({ ...prizeForm, quantity: parseInt(e.target.value) })}
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder:text-slate-600"
                                            placeholder="-1 для бесконечности"
                                        />
                                        <div className="text-[10px] text-slate-500 text-right pr-1">-1 = Бесконечно</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500 ml-1">Изображение</label>
                                    <div className="flex flex-col gap-2">
                                        {(prizeForm.image_url || prizeForm.file) && (
                                            <div className="relative w-full h-32 bg-slate-950 rounded-xl overflow-hidden border border-white/10">
                                                <img
                                                    src={prizeForm.file ? URL.createObjectURL(prizeForm.file) : prizeForm.image_url}
                                                    alt="Preview"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) setPrizeForm({ ...prizeForm, file });
                                            }}
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                                        />
                                        {/* Fallback to URL if needed */}
                                        <input
                                            value={prizeForm.image_url || ''}
                                            onChange={e => setPrizeForm({ ...prizeForm, image_url: e.target.value })}
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none text-slate-500 placeholder:text-slate-700"
                                            placeholder="Или прямая ссылка..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500 ml-1">Описание</label>
                                    <textarea
                                        value={prizeForm.description || ''}
                                        onChange={e => setPrizeForm({ ...prizeForm, description: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder:text-slate-600 min-h-[80px]"
                                        placeholder="Описание приза..."
                                    />
                                </div>

                                <div className="flex items-center gap-3 py-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={prizeForm.is_active}
                                        onChange={e => setPrizeForm({ ...prizeForm, is_active: e.target.checked })}
                                        className="w-5 h-5 rounded border-white/10 bg-slate-950 checked:bg-indigo-600"
                                    />
                                    <label htmlFor="is_active" className="text-sm font-semibold text-white cursor-pointer select-none">
                                        Активен (участвует в розыгрыше)
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white transition-all shadow-lg shadow-indigo-500/20 mt-4"
                                >
                                    {editingPrize ? 'Сохранить изменения' : 'Создать приз'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
            {
                printModalState.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-bold text-white mb-2">Печать наклеек</h3>
                            <p className="text-slate-400 text-sm mb-6">Сколько копий этого QR-кода напечатать?</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 ml-1">Количество копий</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={modalPrintCopies}
                                        onChange={(e) => setModalPrintCopies(parseInt(e.target.value) || 1)}
                                        className="w-full mt-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setPrintModalState({ isOpen: false, link: null })}
                                        className="flex-1 py-3 text-slate-400 font-bold hover:text-white transition-colors"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (printModalState.link) {
                                                printLinks([printModalState.link], modalPrintCopies);
                                                setPrintModalState({ isOpen: false, link: null });
                                            }
                                        }}
                                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/25"
                                    >
                                        Печать
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
