import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to welcome screen on app start
    router.replace('welcome' as any);
  }, [router]);

  return null;
}
