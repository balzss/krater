import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import './globals.css'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const metadata: Metadata = {
  icons: {
    icon: `${basePath}/library-64.png`,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <div className="text-center mt-auto p-4 opacity-70 font-mono text-sm">v0.?</div>
        </ThemeProvider>
      </body>
    </html>
  )
}
