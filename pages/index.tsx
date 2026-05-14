import { useEffect } from 'react';
import { useRouter } from 'next/router';
import React from 'react';

export default function IndexPage(): React.ReactNode {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login on client side
    router.replace('/login');
  }, [router]);

  return null;
}
