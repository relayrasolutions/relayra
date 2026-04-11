import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Super Admin — Relayra Solutions',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
