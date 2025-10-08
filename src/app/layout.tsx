import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import './globals.css'
import { BASE_PATH } from '@/lib/constants'

export const metadata: Metadata = {
  icons: {
    icon: `${BASE_PATH}/library-64.png`,
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
        </ThemeProvider>
      </body>
    </html>
  )
}
