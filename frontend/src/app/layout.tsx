import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Boat Slip Monitor',
  description: 'Monitor boat slip registration pages for changes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
