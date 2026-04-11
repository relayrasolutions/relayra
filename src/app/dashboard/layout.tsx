import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'School Dashboard — Relayra Solutions',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
