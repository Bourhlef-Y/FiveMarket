import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function useAdmin() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'admin')) {
      router.push('/');
    }
  }, [loading, profile, router]);

  return {
    isAdmin: profile?.role === 'admin',
    loading
  };
}
