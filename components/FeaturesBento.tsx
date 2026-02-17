
'use client';

import { motion } from 'framer-motion';
import { BadgeCheck, Building2, Gavel, Plane, CreditCard, ArrowUpRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a utility for merging classes

interface FeatureCardProps {
    title: string;
    description?: string;
    icon: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
}

function FeatureCard({ title, description, icon, className, children }: FeatureCardProps) {
    return (
        <div className={cn(
            "group relative overflow-hidden rounded-3xl bg-white p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-slate-300",
            className
        )}>
            <div className="relative z-10 flex flex-col h-full">
                <div className="mb-4">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-primary border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                        {icon}
                    </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
                {description && <p className="text-slate-500 text-sm leading-relaxed">{description}</p>}
                {children}

                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0 duration-300">
                    <ArrowUpRight className="w-5 h-5 text-slate-300" />
                </div>
            </div>
        </div>
    );
}

export default function FeaturesBento() {
    return (
        <section id="use-cases" className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                        We handle the conflicts <br />you don't have time for.
                    </h2>
                    <p className="text-lg text-slate-600">
                        Our AI agents are trained on legal frameworks and negotiation tactics to get you results.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(200px,auto)]">
                    {/* Card 1: Reputation (Large) */}
                    <FeatureCard
                        title="Remove Negative Reviews"
                        description="For Google Maps, Yelp, and Glassdoor. We identify violations in TOS to get unfair 1-star reviews removed."
                        icon={<BadgeCheck className="w-6 h-6" />}
                        className="md:col-span-2 md:row-span-2 min-h-[400px]"
                    >
                        <div className="mt-8 relative h-48 bg-slate-50 rounded-2xl border border-slate-100 p-4 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <div className="flex gap-1 text-amber-400">
                                    {[1, 2, 3, 4, 5].map((_, i) => (
                                        <span key={i} className="text-2xl">★</span>
                                    ))}
                                </div>
                                <p className="text-slate-400 text-sm italic line-through">"Worst service ever..."</p>
                            </div>

                            <motion.div
                                className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            >
                                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full flex items-center gap-2 border border-red-100 font-medium">
                                    <Trash2 className="w-4 h-4" />
                                    <span>Review Removed</span>
                                </div>
                            </motion.div>
                        </div>
                    </FeatureCard>

                    {/* Card 2: Housing (Medium) */}
                    <FeatureCard
                        title="Lower Your Rent"
                        description="AI negotiates lease renewals using real market data and legal caps."
                        icon={<Building2 className="w-6 h-6" />}
                        className="md:col-span-1 md:row-span-1"
                    />

                    {/* Card 3: Bills (Medium) */}
                    <FeatureCard
                        title="Bill Shark"
                        description="We call Comcast, Gyms, and Insurers to cut your recurring rates."
                        icon={<CreditCard className="w-6 h-6" />}
                        className="md:col-span-1 md:row-span-1"
                    />

                    {/* Card 4: Small */}
                    <FeatureCard
                        title="Flight Compensation"
                        description="Delay? Cancellation? We file the claim and handle the airline support."
                        icon={<Plane className="w-6 h-6" />}
                        className="md:col-span-1 md:row-span-1"
                    />

                    {/* Card 5: Small */}
                    <FeatureCard
                        title="Cancel Subscriptions"
                        description="Stop paying for services you don't use anymore."
                        icon={<Gavel className="w-6 h-6" />}
                        className="md:col-span-2 md:row-span-1"
                    />
                </div>
            </div>
        </section>
    );
}
