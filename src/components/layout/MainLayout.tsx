'use client';
import { usePathname } from 'next/navigation';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthOrAdmin = pathname === '/login' || pathname?.startsWith('/admin');
  
  return (
    <main className={`min-h-screen relative z-10 ${isAuthOrAdmin ? '' : 'pb-24'}`}>
      {children}
    </main>
  );
}
