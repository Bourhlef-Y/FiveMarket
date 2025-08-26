import type { Metadata } from 'next'
import { Teko } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import DebugBox from '@/components/DebugBox'

// Configuration de la police Teko pour le logo
const teko = Teko({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-teko',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FiveMarket',
  description: 'FiveMarket',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${teko.variable} bg-zinc-900 text-zinc-100`} suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster />
            <DebugBox />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
