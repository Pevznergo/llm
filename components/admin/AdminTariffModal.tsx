'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Loader2, Check, Pencil } from 'lucide-react'

interface Tariff {
    id: number
    name: string
    price: number
    original_price: number
    features: string
    type: string
    billing_period: string
}

interface Partner {
    id: number
    name: string
    is_platform: boolean
}

interface AdminTariffModalProps {
    isOpen: boolean
    onClose: () => void
    partner: Partner
}

export default function AdminTariffModal({ isOpen, onClose, partner }: AdminTariffModalProps) {
    const [tariffs, setTariffs] = useState<Tariff[]>([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingTariff, setEditingTariff] = useState<Tariff | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        original_price: '',
        features: '["Feature 1", "Feature 2"]',
        billing_period: 'monthly'
    })

    useEffect(() => {
        if (isOpen && partner) {
            fetchTariffs()
            resetForm()
        }
    }, [isOpen, partner])

    const fetchTariffs = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/tariffs')
            const data = await res.json()
            const partnerTariffs = data.filter((t: any) => t.partner_id === partner.id)
            setTariffs(partnerTariffs)
        } catch (error) {
            console.error('Failed to fetch tariffs', error)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            price: '',
            original_price: '',
            features: '["Feature 1", "Feature 2"]',
            billing_period: 'monthly'
        })
        setEditingTariff(null)
    }

    const handleEdit = (tariff: Tariff) => {
        setEditingTariff(tariff)
        setFormData({
            name: tariff.name,
            price: String(tariff.price),
            original_price: String(tariff.original_price),
            features: tariff.features,
            billing_period: tariff.billing_period
        })
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this tariff?')) return

        try {
            const res = await fetch(`/api/admin/tariffs?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                setTariffs(tariffs.filter(t => t.id !== id))
                if (editingTariff?.id === id) resetForm()
            }
        } catch (error) {
            console.error('Failed to delete tariff', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const payload = {
                ...formData,
                partner_id: partner.id,
                type: partner.is_platform ? 'platform' : 'partner',
                price: Number(formData.price),
                original_price: Number(formData.original_price)
            }

            let res
            if (editingTariff) {
                // Update existing
                res = await fetch('/api/admin/tariffs', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...payload, id: editingTariff.id })
                })
            } else {
                // Create new
                res = await fetch('/api/admin/tariffs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            }

            if (res.ok) {
                const savedTariff = await res.json()
                if (editingTariff) {
                    setTariffs(tariffs.map(t => t.id === savedTariff.id ? savedTariff : t))
                } else {
                    setTariffs([savedTariff, ...tariffs])
                }
                resetForm()
            }
        } catch (error) {
            console.error('Failed to save tariff', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative bg-[#F2F2F7] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Manage Tariffs</h2>
                        <p className="text-sm text-gray-500">{partner.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-8">
                    {/* Create/Edit Form */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">{editingTariff ? 'Edit Plan' : 'Add New Plan'}</h3>
                            {editingTariff && (
                                <button onClick={resetForm} className="text-xs text-red-500 hover:text-red-700 font-medium">
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Plan Name (e.g. Pro)"
                                className="bg-gray-50 border-0 rounded-lg p-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <select
                                className="bg-gray-50 border-0 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500"
                                value={formData.billing_period}
                                onChange={e => setFormData({ ...formData, billing_period: e.target.value })}
                            >
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-400">$</span>
                                <input
                                    type="number"
                                    placeholder="Price"
                                    className="bg-gray-50 border-0 rounded-lg p-3 pl-7 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 w-full"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-400">$</span>
                                <input
                                    type="number"
                                    placeholder="Original Price"
                                    className="bg-gray-50 border-0 rounded-lg p-3 pl-7 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 w-full"
                                    value={formData.original_price}
                                    onChange={e => setFormData({ ...formData, original_price: e.target.value })}
                                />
                            </div>
                            <textarea
                                placeholder='Features JSON (e.g. ["Feature 1"])'
                                className="bg-gray-50 border-0 rounded-lg p-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 md:col-span-2 font-mono text-sm h-20 resize-none"
                                value={formData.features}
                                onChange={e => setFormData({ ...formData, features: e.target.value })}
                                required
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`py-3 px-4 rounded-lg font-bold transition-colors md:col-span-2 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] ${editingTariff ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : (editingTariff ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                                {editingTariff ? 'Update Plan' : 'Add Plan'}
                            </button>
                        </form>
                    </div>

                    {/* List */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900 ml-1">Existing Plans</h3>
                        {loading ? (
                            <div className="text-center py-8 text-gray-400">Loading tariffs...</div>
                        ) : tariffs.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-200 border-dashed">No tariffs found. Add one above.</div>
                        ) : (
                            <div className="grid gap-3">
                                {tariffs.map(tariff => (
                                    <div key={tariff.id} className={`bg-white p-4 rounded-xl shadow-sm border transition-colors flex justify-between items-center group ${editingTariff?.id === tariff.id ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-200'}`}>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900">{tariff.name}</h4>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${tariff.billing_period === 'yearly' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {tariff.billing_period}
                                                </span>
                                            </div>
                                            <div className="text-gray-500 text-sm mt-0.5">
                                                ${Number(tariff.price).toFixed(2)} <span className="line-through text-gray-300 text-xs">${Number(tariff.original_price).toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(tariff)}
                                                className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(tariff.id)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
