import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

import './globals.css';

export const metadata = {
  title: 'Fleet — GTM Intelligence for Founders',
  description: 'Capture research, connect your network, and let AI build your go-to-market strategy.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="fleet-root">{children}</div>
        <Toaster position="bottom-right" theme="dark" richColors closeButton />
      </body>
    </html>
  );
}
