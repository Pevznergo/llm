import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { SessionProvider } from "next-auth/react";
import AuthProvider from "@/components/AuthProvider";
import GoogleTagManager from '@/components/GoogleTagManager';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: {
    default: "Aporto - Все нейросети в одном чате",
    template: "%s | Aporto"
  },
  description: "GPT-4o, Claude 3.5, Gemini 1.5 и другие нейросети в одном интерфейсе. Подключитесь через Telegram или WebApp и используйте лучшие ИИ-модели без VPN и сложных подписок.",
  openGraph: {
    title: "Aporto - Все нейросети в одном чате",
    description: "Попробуйте лучшие нейросети мира (GPT-4, Claude, Gemini) в одном месте. Быстро, удобно, доступно.",
    type: "website",
    locale: "ru_RU",
    url: "https://aporto.tech",
  },
};

import { Suspense } from 'react';

// ... imports

import Mixpanel from '@/components/Mixpanel';

import Script from 'next/script';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={cn("font-sans antialiased", inter.variable)}>
        <Suspense fallback={null}>
          <GoogleTagManager />
        </Suspense>
        <Mixpanel />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
