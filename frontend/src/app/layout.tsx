import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bootsliegeplatz Monitor',
  description: 'Überwache Bootsliegeplatz-Registrierungsseiten auf Änderungen',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
