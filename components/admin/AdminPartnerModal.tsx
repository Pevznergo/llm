'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Save } from 'lucide-react'

export interface Partner {
    id: number
    name: string
    age: string
    bio: string
    discount: string
    logo: string
    is_platform: boolean
    is_partner: boolean
    tariffs: Tariff[]
}

interface Tariff {
    // Assuming Tariff structure, not provided in the prompt
    // Add properties as needed, e.g.,
    // id: number;
    // name: string;
    // price: number;
}

interface AdminPartnerModalProps {
    isOpen: boolean
    onClose: () => void
    partner?: Partner | null
    onSave: () => void
}

export default function AdminPartnerModal({ isOpen, onClose, partner, onSave }: AdminPartnerModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        bio: '',
        discount: '',
        logo: '',
        is_platform: false,
        is_partner: true
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            if (partner) {
                setFormData({
                    name: partner.name,
                    age: partner.age,
                    bio: partner.bio,
                    discount: partner.discount,
                    logo: partner.logo,
                    is_platform: partner.is_platform,
                    is_partner: partner.is_partner
                })
            } else {
                // Reset for new partner
                setFormData({
                    name: '',
                    age: '',
                    bio: '',
                    discount: '',
                    logo: '',
                    is_platform: false,
                    is_partner: true
                })
            }
        }
    }, [isOpen, partner])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const url = '/api/admin/partners'
            const method = partner ? 'PUT' : 'POST'

            const payload = partner ? { ...formData, id: partner.id } : formData

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error('Failed to save partner')

            onSave()
            onClose()
        } catch (error) {
            console.error('Error saving partner:', error)
            alert('Failed to save partner')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-gray-900">
                        {partner ? 'Edit Partner' : 'Add New Partner'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 font-medium"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1">Age/Tagline</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 font-medium"
                                    value={formData.age}
                                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1">Discount</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 50% OFF"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 font-medium"
                                    value={formData.discount}
                                    onChange={e => setFormData({ ...formData, discount: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Bio</label>
                            <textarea
                                required
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all resize-none text-gray-900 font-medium"
                                value={formData.bio}
                                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Logo</label>
                            <div className="space-y-3">
                                {formData.logo && (
                                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                                        <img src={formData.logo} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, logo: '' })}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-6 h-6 text-white" />
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm">
                                        <span>Upload Image</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0]
                                                if (!file) return

                                                const data = new FormData()
                                                data.append('file', file)

                                                try {
                                                    const res = await fetch('/api/upload', {
                                                        method: 'POST',
                                                        body: data
                                                    })
                                                    if (!res.ok) throw new Error('Upload failed')
                                                    const { url } = await res.json()
                                                    setFormData({ ...formData, logo: url })
                                                } catch (error) {
                                                    console.error('Upload error:', error)
                                                    alert('Failed to upload image')
                                                }
                                            }}
                                        />
                                    </label>
                                    <span className="text-xs text-gray-500 font-medium">or</span>
                                    <input
                                        type="text"
                                        placeholder="Paste URL..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-sm text-gray-900"
                                        value={formData.logo}
                                        onChange={e => setFormData({ ...formData, logo: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-200">
                            <h3 className="font-semibold text-gray-900 text-sm">Configuration</h3>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                        checked={formData.is_platform}
                                        onChange={e => setFormData({ ...formData, is_platform: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium text-gray-700">Is Platform?</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                        checked={formData.is_partner}
                                        onChange={e => setFormData({ ...formData, is_partner: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium text-gray-700">Is Partner?</span>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-3 px-4 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                            Save Partner
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
