'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        {
            question: "Do you guarantee removal?",
            answer: "We guarantee the best possible legal argument. No one can guarantee 100% removal as it ultimately depends on the platform's moderator. However, if our scan determines chances are low, we will tell you upfront. You only pay if the removal is successful."
        },
        {
            question: "Do you need my Google/Yelp password?",
            answer: "No. We work as an external representative. We provide you with the legal text to submit, or guide you to safe methods (like granting 'Manager' access) if deeper integration is needed. We never ask for your personal login credentials."
        },
        {
            question: "Is this legal?",
            answer: "Yes. We strictly follow the platform's own Terms of Service and Content Policies. We identify where a review violates existing contracts (defamation, conflict of interest, etc.) and professionally flag it for removal."
        },
        {
            question: "How long does it take?",
            answer: "Our AI generates the appeal instantly. Platform moderators typically review appeals within 3-5 business days. Escalations via demand letter may take longer."
        }
    ];

    return (
        <section className="py-24 bg-slate-50 border-t border-slate-200">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-md cursor-pointer"
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        >
                            <div className="p-6 flex items-center justify-between gap-4">
                                <h3 className="font-bold text-lg text-slate-900 select-none">
                                    {faq.question}
                                </h3>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${openIndex === index ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'}`}>
                                    {openIndex === index ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                </div>
                            </div>

                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                    >
                                        <div className="px-6 pb-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-50 mt-2">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
