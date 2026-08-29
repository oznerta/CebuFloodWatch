import './globals.css';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';

export const metadata = {
  title: 'CebuFloodWatch — Disaster Warning & Evacuation Command',
  description: 'Real-Time Flood Intelligence & Evacuation Coordination for Metro Cebu',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen bg-surface-app text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
