import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutoDM — AI Instagram Automation & Marketing Platform',
  description: 'Automate Instagram DMs, comments, lead qualification and customer conversations with AI-powered workflows.',
  keywords: ['Instagram Automation', 'AI Marketing', 'Auto DM', 'Instagram Chatbot', 'Lead Qualification', 'Social Media Automation'],
  openGraph: {
    title: 'AutoDM — AI Instagram Automation & Marketing Platform',
    description: 'Automate Instagram DMs, comments, lead qualification and customer conversations with AI-powered workflows.',
    url: 'https://autodm.onewayfix.com',
    siteName: 'AutoDM',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoDM — AI Instagram Automation & Marketing Platform',
    description: 'Automate Instagram DMs, comments, lead qualification and customer conversations with AI-powered workflows.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full dark scroll-smooth">
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-violet-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
