'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Play, Trash, Check, X, Server, RefreshCw, Activity, ZapOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

export default function DispatcherDashboard() {
    const { toast } = useToast();
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Add Model Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [addMode, setAddMode] = useState<'template' | 'json'>('template');
    const [isTesting, setIsTesting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean, message: string } | null>(null);

    const [formData, setFormData] = useState({
        name: 'gemini-balance-nodes',
        api_key: '',
        proxy_url: '',
        daily_request_limit: 50,
    });

    const fetchModels = async () => {
        try {
            const res = await fetch('/api/manage/models');
            const data = await res.json();
            if (data.models) setModels(data.models);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModels();
        // Poll every 30 seconds
        const interval = setInterval(fetchModels, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleTest = async () => {
        if (!formData.api_key || !formData.proxy_url) {
            toast({ title: "Error", description: "API Key and Proxy URL required for testing", variant: "destructive" });
            return;
        }

        setIsTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/manage/models/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: formData.api_key,
                    proxy_url: formData.proxy_url
                })
            });
            const data = await res.json();
            if (res.ok) {
                setTestResult({ success: true, message: data.message });
                toast({ title: "Success", description: "Proxy connection verified!" });
            } else {
                setTestResult({ success: false, message: data.error });
                toast({ title: "Connection Failed", description: data.error, variant: "destructive" });
            }
        } catch (e: any) {
            setTestResult({ success: false, message: e.message });
        } finally {
            setIsTesting(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.api_key || !formData.daily_request_limit) {
            toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/manage/models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                toast({ title: "Success", description: "Model added to queue and Gost proxy initialized." });
                setIsModalOpen(false);
                setFormData({ name: 'gemini-balance-nodes', api_key: '', proxy_url: '', daily_request_limit: 50 });
                setTestResult(null);
                fetchModels();
            } else {
                toast({ title: "Failed to Add", description: data.error, variant: "destructive" });
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? This will kill the Gost Docker container and remove it from LiteLLM.")) return;
        try {
            const res = await fetch(`/api/manage/models/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: "Deleted", description: "Model and local proxy removed." });
                fetchModels();
            } else {
                const data = await res.json();
                toast({ title: "Error", description: data.error, variant: "destructive" });
            }
        } catch (e: any) {
            console.error(e);
        }
    };

    const activeModels = models.filter(m => m.status === 'active');
    const queuedModels = models.filter(m => m.status === 'queued');
    const exhaustedModels = models.filter(m => m.status === 'exhausted');

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Airport Dispatcher</h1>
                    <p className="text-muted-foreground">Manage LiteLLM Proxy Gateways</p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-2 border p-4 rounded-lg bg-card">
                        <Switch id="auto-mode" />
                        <Label htmlFor="auto-mode" className="font-semibold text-lg cursor-pointer">Auto Dispatcher</Label>
                    </div>
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="gap-2">
                                <Plus className="h-5 w-5" />
                                Add New Model
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Add AI Node to Dispatch Queue</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>LiteLLM Node Group Name</Label>
                                    <Input
                                        placeholder="gemini-balance-nodes"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">Models sharing this name will be load-balanced together by LiteLLM.</p>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Provider API Key</Label>
                                    <Input
                                        type="password"
                                        placeholder="sk-..."
                                        value={formData.api_key}
                                        onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>SOCKS5 Proxy URL (Optional)</Label>
                                    <Input
                                        placeholder="socks5h://user:pass@ip:port"
                                        value={formData.proxy_url}
                                        onChange={(e) => setFormData({ ...formData, proxy_url: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">System will automatically spawn a local Gost Docker container to decode this.</p>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Daily Request Limit</Label>
                                    <Input
                                        type="number"
                                        value={formData.daily_request_limit}
                                        onChange={(e) => setFormData({ ...formData, daily_request_limit: Number(e.target.value) })}
                                    />
                                </div>

                                {testResult && (
                                    <div className={`p-3 rounded-md text-sm border ${testResult.success ? 'bg-green-500/10 border-green-500/50 text-green-600' : 'bg-red-500/10 border-red-500/50 text-red-600'}`}>
                                        {testResult.success ? <Check className="h-4 w-4 inline mr-2" /> : <X className="h-4 w-4 inline mr-2" />}
                                        {testResult.message}
                                    </div>
                                )}
                            </div>
                            <DialogFooter className="flex justify-between sm:justify-between w-full">
                                <Button variant="outline" onClick={handleTest} disabled={isTesting || !formData.api_key}>
                                    {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                    Test Connection
                                </Button>
                                <Button onClick={handleCreate} disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Add to Queue
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 items-start">

                {/* ACTIVE COLUMN */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-green-600">
                            <Activity className="h-5 w-5" />
                            Active Now
                        </h2>
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {activeModels.length} / 4
                        </span>
                    </div>

                    <div className="space-y-4 min-h-[300px]">
                        {activeModels.map(model => (
                            <Card key={model.id} className="border-green-200 bg-green-50/10 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-md" />
                                <CardHeader className="py-4">
                                    <CardTitle className="text-lg flex justify-between">
                                        {model.name}
                                        <Badge variant="outline" className="text-xs">#{model.id}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="py-2 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Requests Today:</span>
                                        <span className="font-medium">{model.requests_today} / {model.daily_request_limit}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Gateway:</span>
                                        <span className="font-mono text-xs max-w-[150px] truncate" title={model.gost_container_id || 'Native'}>
                                            {model.gost_container_id || 'Native Route'}
                                        </span>
                                    </div>
                                </CardContent>
                                <CardFooter className="py-3 bg-muted/20 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(model.id)}>Kill</Button>
                                </CardFooter>
                            </Card>
                        ))}
                        {activeModels.length === 0 && !loading && (
                            <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                                No active models. The dispatcher will pick from the queue.
                            </div>
                        )}
                    </div>
                </div>

                {/* QUEUED COLUMN */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-blue-600">
                            <Server className="h-5 w-5" />
                            Queued (Waitlist)
                        </h2>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {queuedModels.length} models
                        </span>
                    </div>

                    <div className="space-y-4 min-h-[300px]">
                        {queuedModels.map(model => (
                            <Card key={model.id} className="border-blue-200 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-md" />
                                <CardHeader className="py-4">
                                    <CardTitle className="text-lg">{model.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="py-2 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Daily Limit:</span>
                                        <span className="font-medium">{model.daily_request_limit}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                                        <span>Gateway status:</span>
                                        {model.gost_container_id ? (
                                            <span className="text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Spawend</span>
                                        ) : (
                                            <span>Native Node</span>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="py-3 bg-muted/20 flex justify-end gap-2">
                                    <Button variant="outline" size="sm" className="hidden group-hover:flex">Force Start</Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(model.id)}>Discard</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* EXHAUSTED COLUMN */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-red-600">
                            <ZapOff className="h-5 w-5" />
                            Exhausted (Cooldown)
                        </h2>
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {exhaustedModels.length}
                        </span>
                    </div>

                    <div className="space-y-4 min-h-[300px]">
                        {exhaustedModels.map(model => (
                            <Card key={model.id} className="border-red-200 bg-red-50/30 shadow-sm relative overflow-hidden group opacity-75 grayscale hover:grayscale-0 transition-all">
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-md" />
                                <CardHeader className="py-4">
                                    <CardTitle className="text-lg line-through text-muted-foreground">{model.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="py-2 text-sm">
                                    <p className="text-red-800 font-medium">Daily limit reached ({model.daily_request_limit})</p>
                                </CardContent>
                                <CardFooter className="py-3 flex justify-between">
                                    <Button variant="ghost" size="sm" className="text-xs">Reset Counters</Button>
                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(model.id)}>Clear</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

// Simple internal Badge component so we don't need to import it
function Badge({ children, className, variant = "default", ...props }: any) {
    let style = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
    if (variant === "outline") style += " text-foreground";
    return <div className={`${style} ${className}`} {...props}>{children}</div>;
}
