import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Detektif Cowy",
  description: "Solve the case. Find the truth.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className="dark">
      <body className="bg-background text-ui-text-off-white font-franklin antialiased">
        {children}
      </body>
    </html>
  )
}
