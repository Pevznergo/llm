'use client'

import { useState } from 'react'
import { X, CreditCard, Lock, CheckCircle } from 'lucide-react'

interface CheckoutModalProps {
    isOpen: boolean
    onClose: () => void
    bundleName: string
    price: number
    partnerName: string
    billingPeriod: 'monthly' | 'yearly'
}

export default function CheckoutModal({ isOpen, onClose, bundleName, price, partnerName, billingPeriod }: CheckoutModalProps) {
    const [step, setStep] = useState<'form' | 'processing' | 'success'>('form')

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setStep('processing')
        setTimeout(() => {
            setStep('success')
        }, 2000)
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {step === 'form' && (
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Secure Checkout</h3>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl mb-6 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-gray-900">{bundleName}</p>
                                <p className="text-sm text-gray-500">Vibeflow + {partnerName}</p>
                            </div>
                            <div className="text-xl font-black text-gray-900">
                                ${price}/{billingPeriod === 'yearly' ? 'year' : 'mo'}
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Card Number</label>
                                <div className="relative">
                                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 pl-10 font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-black" required />
                                    <CreditCard className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expiry</label>
                                    <input type="text" placeholder="MM/YY" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-black" required />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CVC</label>
                                    <input type="text" placeholder="123" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-black" required />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                            <Lock className="w-4 h-4" />
                            Pay ${price}
                        </button>
                    </form>
                )}

                {step === 'processing' && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Payment...</h3>
                        <p className="text-gray-500">Please do not close this window.</p>
                    </div>
                )}

                {step === 'success' && (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">You're a Power Couple!</h3>
                        <p className="text-gray-500 mb-8">Your subscription is active. Check your email for access details.</p>
                        <button onClick={onClose} className="w-full bg-black text-white font-bold py-3 rounded-xl">
                            Start Creating
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
