import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

const inputClasses =
  'theme-input-field w-full rounded-[24px] px-[20px] py-[16px] font-diatype text-[14px] tracking-m3p';
const allowPasswordReset =
  process.env.NEXT_PUBLIC_ALLOW_PASSWORD_RESET?.toLowerCase() === 'true';

const ResetPasswordPage: React.FC = () => {
  const router = useRouter();
  const token = typeof router.query.token === 'string' ? router.query.token : '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (!allowPasswordReset) {
      setError('Password reset is disabled for this deployment.');
      setIsChecking(false);
      return;
    }

    if (!token) {
      setError('This password reset link is invalid or incomplete.');
      setIsChecking(false);
      return;
    }

    const validate = async () => {
      const response = await fetch(
        `/api/auth/reset-password?token=${encodeURIComponent(token)}`
      );
      const data = (await response.json()) as {
        valid?: boolean;
        email?: string;
        error?: string;
      };

      if (!response.ok || !data.valid) {
        setError(data.error || 'This password reset link is invalid or has expired.');
        setIsChecking(false);
        return;
      }

      setEmail(data.email || '');
      setIsChecking(false);
    };

    void validate();
  }, [router.isReady, token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setError(data.error || 'Unable to reset password.');
      setIsSubmitting(false);
      return;
    }

    setSuccess(data.message || 'Your password has been updated. You can now log in.');
    setIsSubmitting(false);
    setPassword('');
    setConfirmPassword('');
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
            Reset password
          </h1>
          <p className="theme-page-muted mt-[16px] max-w-[560px] font-dmSans text-[16px] leading-120">
            Set a new password for this account.
          </p>

          {email ? (
            <p className="theme-page-subtle mt-[10px] font-diatype text-[12px] uppercase tracking-m3p">
              {email}
            </p>
          ) : null}

          {isChecking ? (
            <p className="theme-eyebrow mt-[24px] font-diatype text-[12px] uppercase tracking-m3p">
              Checking reset link…
            </p>
          ) : success ? (
            <div className="theme-card mt-[24px] rounded-[24px] p-[18px]">
              <p className="theme-page-muted font-dmSans text-[15px] leading-120">
                {success}
              </p>
              <Link
                href="/?auth=login"
                className="theme-primary-button mt-[14px] inline-flex rounded-[999px] px-[16px] py-[10px] font-diatype text-[11px] uppercase tracking-m3p"
              >
                Return to login
              </Link>
            </div>
          ) : (
            <form className="mt-[24px] grid gap-[14px]" onSubmit={handleSubmit}>
              <input
                required
                minLength={8}
                type="password"
                placeholder="New password"
                className={inputClasses}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <input
                required
                minLength={8}
                type="password"
                placeholder="Confirm new password"
                className={inputClasses}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />

              {error ? (
                <p className="font-diatype text-[12px] uppercase tracking-m3p text-[#FF9500]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="theme-primary-button inline-flex min-h-[52px] items-center justify-center rounded-[24px] px-[24px] py-[14px] font-inter text-[14px] capitalize disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Updating password…' : 'Set new password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default ResetPasswordPage;
