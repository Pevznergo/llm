
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="inline-block mb-4">
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                                Aporto
                            </span>
                        </Link>
                        <p className="text-sm text-slate-500 mb-4">
                            Ваш персональный ИИ-ассистент. Экономьте время и нервы с помощью нейросетей.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Модели</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link href="/claude" className="hover:text-primary transition-colors">Claude 3.5</Link></li>
                            <li><Link href="/gemini" className="hover:text-primary transition-colors">Gemini 1.5</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Компания</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link href="/blog" className="hover:text-primary transition-colors">Блог обновлений</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">О нас</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Документы</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">Политика конфиденциальности</Link></li>
                            <li><Link href="/terms-of-service" className="hover:text-primary transition-colors">Условия использования</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-slate-500">
                        © 2026 Aporto. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
