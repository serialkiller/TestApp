  // app/layout.js
  import './globals.css'
  
  export const metadata = {
    title: 'ChatGPT Client',
    description: 'A ChatGPT-like client built with Next.js',
  }
  
  export default function RootLayout({ children }) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    )
  }
  