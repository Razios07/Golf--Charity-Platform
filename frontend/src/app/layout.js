import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/components/AuthContext'

export const metadata = {
  title: 'GolfCharity — Play. Win. Give.',
  description: 'Subscription golf platform combining performance tracking, prize draws, and charitable giving.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="noise">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#f5f5f5',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#000' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#000' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
