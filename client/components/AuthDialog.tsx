import { Dialog, Transition } from '@headlessui/react';
import React, { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

const initialLoginState = { email: '', password: '' };
const initialSignupState = { name: '', email: '', company: '', password: '' };

const panelClasses =
  'theme-panel w-full rounded-[40px] p-[32px] max-md:rounded-[28px] max-md:p-[20px]';

const inputClasses =
  'theme-input-field w-full rounded-[24px] px-[20px] py-[16px] font-diatype text-[14px] tracking-m3p';
const allowPublicSignup =
  process.env.NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP?.toLowerCase() === 'true';
const allowPasswordReset =
  process.env.NEXT_PUBLIC_ALLOW_PASSWORD_RESET?.toLowerCase() === 'true';

const AuthDialog: React.FC = () => {
  const router = useRouter();
  const {
    closeAuth,
    isDialogOpen,
    login,
    mode,
    openAuth,
    signup,
    switchMode,
    user,
  } = useAuth();
  const [loginState, setLoginState] = useState(initialLoginState);
  const [signupState, setSignupState] = useState(initialSignupState);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectPath, setRedirectPath] = useState('');

  useEffect(() => {
    if (!isDialogOpen) {
      setError('');
      setIsSubmitting(false);
      setRedirectPath('');
    }
  }, [isDialogOpen]);

  useEffect(() => {
    if (!router.isReady || user) {
      return;
    }

    const authQuery = router.query.auth;
    const nextQuery = router.query.next;
    const authMode =
      authQuery === 'signup' ? 'signup' : authQuery === 'login' ? 'login' : null;

    if (!authMode) {
      return;
    }

    const safeNext =
      typeof nextQuery === 'string' && nextQuery.startsWith('/')
        ? nextQuery
        : '/workspace';

    setRedirectPath(safeNext);
    openAuth(authMode);

    void router.replace(
      {
        pathname: router.pathname,
        query: Object.fromEntries(
          Object.entries(router.query).filter(
            ([key]) => key !== 'auth' && key !== 'next'
          )
        ),
      },
      undefined,
      { shallow: true }
    );
  }, [openAuth, router, user]);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    closeAuth();
  };

  const resolveRedirectPath = (nextRole?: string) => {
    if (redirectPath) {
      return redirectPath;
    }

    if (
      nextRole === 'super_admin' ||
      nextRole === 'admin' ||
      nextRole === 'project_lead'
    ) {
      return '/admin';
    }

    return '/workspace';
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(loginState);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    closeAuth();
    setLoginState(initialLoginState);
    setIsSubmitting(false);
    await router.push(resolveRedirectPath(result.user?.role));
  };

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await signup(signupState);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    closeAuth();
    setSignupState(initialSignupState);
    setIsSubmitting(false);
    await router.push(resolveRedirectPath(result.user?.role));
  };

  return (
    <Transition.Root show={isDialogOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="theme-modal-overlay fixed inset-0 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto basic-pd">
          <div className="flex min-h-full items-center justify-center py-[40px]">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-6"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-[520px]">
                <div className={panelClasses}>
                  <div className="flex items-start justify-between gap-[16px]">
                    <div className="flex flex-col gap-[12px]">
                      <span className="theme-eyebrow font-diatype text-[12px] uppercase tracking-m3p">
                        Account
                      </span>
                      <Dialog.Title className="font-dmSans text-[40px] font-light leading-100 tracking-m3p max-md:text-[30px]">
                        {mode === 'login' ? 'Welcome back' : 'Create an account'}
                      </Dialog.Title>
                      <p className="theme-page-muted max-w-[360px] font-dmSans text-[16px] leading-120">
                        {mode === 'login'
                          ? 'Log in to access your Client Workspace and review the current project record.'
                          : allowPublicSignup
                            ? 'Create a lightweight account to access your Client Workspace and project record.'
                            : 'This deployment uses admin-created accounts only. Mirror Progress can create access for invited clients.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleClose}
                      className="theme-secondary-button inline-flex h-[40px] w-[40px] items-center justify-center rounded-full font-diatype text-[18px]"
                      aria-label="Close account dialog"
                    >
                      ×
                    </button>
                  </div>

                  {mode === 'login' ? (
                    <form className="mt-[28px] flex flex-col gap-[14px]" onSubmit={handleLogin}>
                      <input
                        required
                        type="email"
                        placeholder="Email"
                        className={inputClasses}
                        value={loginState.email}
                        onChange={(event) =>
                          setLoginState((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                      />
                      <input
                        required
                        minLength={8}
                        type="password"
                        placeholder="Password"
                        className={inputClasses}
                        value={loginState.password}
                        onChange={(event) =>
                          setLoginState((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                      />

                      {allowPasswordReset ? (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              closeAuth();
                              void router.push('/account/forgot-password');
                            }}
                            className="theme-page-subtle font-diatype text-[11px] uppercase tracking-m3p transition hover:text-[color:var(--theme-page-text)]"
                          >
                            Forgot password?
                          </button>
                        </div>
                      ) : null}

                      {error ? (
                        <p className="font-diatype text-[12px] uppercase tracking-m3p text-[#FF9500]">
                          {error}
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="theme-primary-button mt-[10px] inline-flex min-h-[52px] items-center justify-center rounded-[24px] px-[24px] py-[14px] font-inter text-[14px] capitalize disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting ? 'Logging in…' : 'Login'}
                      </button>
                    </form>
                  ) : allowPublicSignup ? (
                    <form className="mt-[28px] flex flex-col gap-[14px]" onSubmit={handleSignup}>
                      <input
                        required
                        minLength={2}
                        type="text"
                        placeholder="Name"
                        className={inputClasses}
                        value={signupState.name}
                        onChange={(event) =>
                          setSignupState((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                      />
                      <input
                        required
                        type="email"
                        placeholder="Email"
                        className={inputClasses}
                        value={signupState.email}
                        onChange={(event) =>
                          setSignupState((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                      />
                      <input
                        required
                        minLength={2}
                        type="text"
                        placeholder="Company"
                        className={inputClasses}
                        value={signupState.company}
                        onChange={(event) =>
                          setSignupState((current) => ({
                            ...current,
                            company: event.target.value,
                          }))
                        }
                      />
                      <input
                        required
                        minLength={8}
                        type="password"
                        placeholder="Password"
                        className={inputClasses}
                        value={signupState.password}
                        onChange={(event) =>
                          setSignupState((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                      />

                      {error ? (
                        <p className="font-diatype text-[12px] uppercase tracking-m3p text-[#FF9500]">
                          {error}
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="theme-primary-button mt-[10px] inline-flex min-h-[52px] items-center justify-center rounded-[24px] px-[24px] py-[14px] font-inter text-[14px] capitalize disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting ? 'Creating account…' : 'Signup'}
                      </button>
                    </form>
                  ) : (
                    <div className="theme-card mt-[28px] rounded-[24px] p-[18px]">
                      <p className="theme-page-muted font-dmSans text-[15px] leading-120">
                        Public signup is disabled for this deployment. Mirror
                        Progress can create and assign client accounts from the
                        admin dashboard.
                      </p>
                    </div>
                  )}

                  <div className="theme-eyebrow mt-[18px] flex items-center gap-[8px] font-diatype text-[12px] uppercase tracking-m3p">
                    {mode === 'login' && allowPublicSignup ? (
                      <>
                        <span>Need an account?</span>
                        <button
                          type="button"
                          onClick={() => switchMode('signup')}
                          className="theme-link transition"
                        >
                          Signup
                        </button>
                      </>
                    ) : mode === 'signup' ? (
                      <>
                        <span>Already have an account?</span>
                        <button
                          type="button"
                          onClick={() => switchMode('login')}
                          className="theme-link transition"
                        >
                          Login
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default AuthDialog;
