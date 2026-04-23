import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';
import { getAppAccessPassword, isProtectedMode } from '../lib/app-runtime';

const inputClasses =
  'theme-input-field w-full rounded-[24px] px-[20px] py-[16px] font-diatype text-[14px] tracking-m3p';

interface AccessPageProps {
  isConfigured: boolean;
}

const AccessPage: React.FC<AccessPageProps> = ({ isConfigured }) => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = useMemo(() => {
    const candidate = typeof router.query.next === 'string' ? router.query.next : '/';
    return candidate.startsWith('/') ? candidate : '/';
  }, [router.query.next]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const response = await fetch('/api/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error || 'Unable to unlock this deployment.');
      setIsSubmitting(false);
      return;
    }

    await router.replace(nextPath);
  };

  return (
    <section className="theme-page basic-pd min-h-screen py-[28px] md:py-[36px]">
      <div className="mx-auto flex max-w-[720px] flex-col gap-[20px]">
        <Link
          href="/"
          className="theme-page-subtle font-diatype text-[11px] uppercase tracking-m3p transition hover:text-[color:var(--theme-page-text)]"
        >
          Mirror Progress
        </Link>

        <div className="theme-panel rounded-[32px] px-[28px] py-[26px] max-md:rounded-[24px] max-md:px-[18px]">
          <span className="theme-eyebrow font-diatype text-[12px] uppercase tracking-m3p">
            Protected Deployment
          </span>
          <h1 className="mt-[14px] font-dmSans text-[38px] font-light leading-100 tracking-m3p max-md:text-[28px]">
            Access required
          </h1>
          <p className="theme-page-muted mt-[16px] max-w-[560px] font-dmSans text-[16px] leading-120">
            This deployment is running in a limited demo mode. Enter the deployment
            access password to continue to the site.
          </p>

          {isConfigured ? (
            <form className="mt-[24px] grid gap-[14px]" onSubmit={handleSubmit}>
              <input
                required
                type="password"
                placeholder="Deployment access password"
                className={inputClasses}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              {error ? (
                <p className="font-diatype text-[12px] uppercase tracking-m3p text-[#FF9500]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="theme-primary-button inline-flex min-h-[52px] items-center justify-center rounded-[24px] px-[24px] py-[14px] font-inter text-[14px] capitalize disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Unlocking…' : 'Enter deployment'}
              </button>
            </form>
          ) : (
            <div className="theme-card mt-[24px] rounded-[24px] p-[18px]">
              <p className="theme-page-muted font-dmSans text-[15px] leading-120">
                Protected mode is enabled, but `APP_ACCESS_PASSWORD` is not set.
                Configure it in Vercel before using this deployment.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export const getServerSideProps: GetServerSideProps<AccessPageProps> = async () => {
  if (!isProtectedMode()) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {
      isConfigured: Boolean(getAppAccessPassword()),
    },
  };
};

export default AccessPage;
