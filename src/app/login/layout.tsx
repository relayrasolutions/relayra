import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login — Relayra Solutions',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
