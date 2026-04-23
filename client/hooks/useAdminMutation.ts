import { useRouter } from 'next/router';
import { useState } from 'react';

export function useAdminMutation() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const runMutation = async <T,>(
    payload: Record<string, unknown>,
    options?: {
      onSuccess?: (data: T) => Promise<void> | void;
      refresh?: boolean;
    }
  ) => {
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as T & { error?: string };

      if (!response.ok) {
        setError(data.error || 'Unable to save changes.');
        return null;
      }

      if (options?.onSuccess) {
        await options.onSuccess(data);
      }

      if (options?.refresh !== false) {
        await router.replace(router.asPath);
      }

      return data;
    } catch {
      setError('Unable to save changes.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    error,
    isSubmitting,
    clearError: () => setError(''),
    runMutation,
  };
}
