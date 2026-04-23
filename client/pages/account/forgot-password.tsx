import Link from 'next/link';
import React, { useState } from 'react';

const inputClasses =
  'theme-input-field w-full rounded-[24px] px-[20px] py-[16px] font-diatype text-[14px] tracking-m3p';
const allowPasswordReset =
  process.env.NEXT_PUBLIC_ALLOW_PASSWORD_RESET?.toLowerCase() === 'true';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    message: string;
    resetUrl: string | null;
    expiresAt: string | null;
  } | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json()) as {
      error?: string;
      message?: string;
      resetUrl?: string | null;
      expiresAt?: string | null;
    };

    if (!response.ok) {
      setError(data.error || 'Unable to start password reset.');
      setIsSubmitting(false);
      return;
    }

    setResult({
      message:
        data.message ||
        'If an account exists for that email, a local development reset link is now available.',
      resetUrl: data.resetUrl ?? null,
      expiresAt: data.expiresAt ?? null,
    });
    setIsSubmitting(false);
  };

  return (
    <section className="theme-page basic-pd min-h-screen py-[28px] md:py-[36px]">
      <div className="mx-auto flex max-w-[720px] flex-col gap-[20px]">
        <Link
          href="/"
          className="theme-page-subtle font-diatype text-[11px] uppercase tracking-m3p transition hover:text-[color:var(--theme-page-text)]"
        >
          Back Home
        </Link>

        <div className="theme-panel rounded-[32px] px-[28px] py-[26px] max-md:rounded-[24px] max-md:px-[18px]">
          <span className="theme-eyebrow font-diatype text-[12px] uppercase tracking-m3p">
            Account
          </span>
          <h1 className="mt-[14px] font-dmSans text-[38px] font-light leading-100 tracking-m3p max-md:text-[28px]">
            Forgot password
          </h1>
          <p className="theme-page-muted mt-[16px] max-w-[560px] font-dmSans text-[16px] leading-120">
            {allowPasswordReset
              ? 'Request a demo password reset link for your account. In this MVP flow, the link is surfaced directly in the interface instead of being emailed.'
              : 'Password reset is disabled for this deployment. Ask Mirror Progress to update access manually or enable the reset flow for this environment.'}
          </p>

          {allowPasswordReset ? (
            <form className="mt-[24px] grid gap-[14px]" onSubmit={handleSubmit}>
              <input
                required
                type="email"
                placeholder="Email"
                className={inputClasses}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                {isSubmitting ? 'Preparing link…' : 'Request reset link'}
              </button>
            </form>
          ) : null}

          {result ? (
            <div className="theme-card mt-[20px] rounded-[24px] p-[18px]">
              <p className="theme-page-muted font-dmSans text-[15px] leading-120">
                {result.message}
              </p>
              {result.resetUrl ? (
                <div className="mt-[14px] flex flex-col gap-[10px]">
                  <span className="theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p">
                    Local reset link
                  </span>
                  <Link
                    href={result.resetUrl}
                    className="theme-panel-strong break-all rounded-[18px] px-[14px] py-[12px] font-diatype text-[12px] uppercase tracking-m3p transition"
                  >
                    {result.resetUrl}
                  </Link>
                  <p className="theme-page-subtle font-dmSans text-[13px] leading-120">
                    Expires {result.expiresAt ? new Date(result.expiresAt).toLocaleString() : 'soon'}.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="theme-eyebrow mt-[18px] font-diatype text-[12px] uppercase tracking-m3p">
            <Link href="/?auth=login" className="theme-link transition">
              Return to login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
