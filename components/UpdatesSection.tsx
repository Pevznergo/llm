'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar } from 'lucide-react';
import { getRecentPosts } from '@/lib/blog';

export default function UpdatesSection() {
    const posts = getRecentPosts(3);

    return (
        <section className="py-24 bg-white border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Последние обновления</h2>
                        <div className="h-1 w-20 bg-[#007AFF] rounded-full"></div>
                    </div>
                    <Link href="/blog" className="hidden md:flex items-center text-[#007AFF] font-semibold hover:gap-2 transition-all">
                        Все новости <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {posts.map((post, idx) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="group flex flex-col h-full"
                        >
                            <Link href={`/blog/${post.slug}`} className="block h-full p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-4">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md">News</span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {post.date}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#007AFF] transition-colors leading-tight">
                                    {post.title}
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">
                                    {post.excerpt}
                                </p>
                                <div className="mt-auto flex items-center text-sm font-bold text-[#007AFF]">
                                    Читать далее
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-8 text-center md:hidden">
                    <Link href="/blog" className="inline-flex items-center text-[#007AFF] font-semibold">
                        Все новости <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
