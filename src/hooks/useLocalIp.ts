import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * ローカルIPアドレスを取得するカスタムフック
 */
export const useLocalIp = () => {
  const [localIp, setLocalIp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocalIp = async () => {
      try {
        const ip = await invoke<string>('get_local_ip');
        setLocalIp(ip);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get local IP');
        setLocalIp(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLocalIp();
  }, []);

  return { localIp, loading, error };
};