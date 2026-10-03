'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthOrAdmin = pathname === '/login' || pathname?.startsWith('/admin');
  
  const lastKeyRef = useRef<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'a' && lastKeyRef.current === 'g') {
        // We let the /admin route handle the admin check.
        router.push('/admin');
      }
      
      lastKeyRef.current = e.key;
      // Reset sequence after a short delay
      setTimeout(() => {
        if (lastKeyRef.current === e.key) {
          lastKeyRef.current = '';
        }
      }, 1000);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <main className={`min-h-screen relative z-10 ${isAuthOrAdmin ? '' : 'pb-24'}`}>
      {children}
    </main>
  );
}
