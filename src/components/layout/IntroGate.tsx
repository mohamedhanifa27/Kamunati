'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function IntroGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Never run on login page - login page handles its own intro-to-login sequence
    if (pathname === '/login') return;
    if (status === 'loading') return;

    // If an unauthenticated user opens the root site, route to login where intro plays
    if (pathname === '/' && !session?.user) {
      router.replace('/login');
    }
  }, [pathname, session, status, router]);

  return null;
}
