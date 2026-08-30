import './globals.css';
import { AppShell } from '../components/layout/AppShell';

export const metadata = {
  title: 'CebuFloodWatch — Disaster Warning & Evacuation Command',
  description: 'Real-Time Flood Intelligence & Evacuation Coordination for Metro Cebu',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
