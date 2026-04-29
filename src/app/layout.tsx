import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'HackTrack — Hackathon Command Center',
  description: 'Manage hackathons, sync your team, track deadlines, and never miss a round.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function () {
              try {
                var stored = localStorage.getItem('theme-mode');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var shouldBeDark = stored ? stored === 'dark' : prefersDark;
                var html = document.documentElement;
                html.classList.toggle('dark', shouldBeDark);
                html.classList.toggle('light', !shouldBeDark);
                html.style.colorScheme = shouldBeDark ? 'dark' : 'light';
              } catch (e) {}
            })();`}
        </Script>
      </head>
      <body className="bg-bg-primary text-text-primary font-mono antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0f1825',
              color: '#e2e8f0',
              border: '1px solid #1a2740',
              borderRadius: '8px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
            },
            success: { iconTheme: { primary: '#00d4aa', secondary: '#0f1825' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#0f1825' } },
          }}
        />
      </body>
    </html>
  )
}
