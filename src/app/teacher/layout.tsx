import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teacher Portal — Relayra Solutions',
};

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return children;
}
