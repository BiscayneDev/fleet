import type { ReactNode } from 'react';

import './globals.css';

export const metadata = {
  title: 'Fleet',
  description: 'Fleet personal operating system',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="fleet-root">{children}</div>
      </body>
    </html>
  );
}
