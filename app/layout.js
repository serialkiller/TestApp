import './globals.css'
import 'katex/dist/katex.min.css'

export const metadata = {
  title: 'Test Client',
  description: 'Husains app built with Next.js',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
