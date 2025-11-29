import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils'; // Utility for merging Tailwind classes

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
    title: 'Smart Task Evaluator | Gen-AI SaaS',
    description: 'AI-powered code evaluation platform built with Next.js and Supabase.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={cn(
                    'min-h-screen bg-background font-sans antialiased',
                    inter.variable
                )}
            >
                <main>{children}</main>
            </body>
        </html>
    );
}