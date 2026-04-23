import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import AccountMenu from '../AccountMenu';
import ThemeToggle from '../ThemeToggle';

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/activity', label: 'Activity' },
];

interface AdminShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const AdminShell: React.FC<AdminShellProps> = ({
  title,
  description,
  children,
  actions,
}) => {
  const router = useRouter();

  return (
    <section className="theme-page basic-pd min-h-screen py-[20px] md:py-[24px]">
      <div className="mx-auto grid max-w-[1480px] gap-[18px] lg:grid-cols-[220px_1fr]">
        <aside className="theme-panel-strong rounded-[32px] p-[18px] max-lg:hidden">
          <div className="flex flex-col gap-[18px]">
            <Link
              href="/"
              className="theme-page-subtle font-diatype text-[11px] uppercase tracking-m3p transition hover:text-[color:var(--theme-page-text)]"
            >
              Back Home
            </Link>
            <div className="flex flex-col gap-[10px]">
              <span className="theme-eyebrow font-diatype text-[12px] uppercase tracking-m3p">
                Admin Dashboard
              </span>
              <p className="theme-page-muted font-dmSans text-[18px] font-light leading-110">
                Internal control center for the client workspace platform.
              </p>
            </div>
            <nav className="mt-[12px] flex flex-col gap-[8px]">
              {navItems.map((item) => {
                const active = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-[20px] px-[14px] py-[12px] font-diatype text-[12px] uppercase tracking-m3p transition ${
                      active
                        ? 'theme-chip border'
                        : 'border border-transparent bg-transparent text-[color:var(--theme-page-text-muted)] hover:border-[color:var(--theme-border)] hover:bg-[color:var(--theme-card-bg)] hover:text-[color:var(--theme-page-text)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex flex-col gap-[18px]">
          <header className="theme-panel-strong rounded-[32px] px-[24px] py-[20px] max-md:rounded-[24px] max-md:px-[18px]">
            <div className="flex flex-wrap items-center justify-between gap-[16px]">
              <div className="flex flex-col gap-[12px]">
                <div className="flex items-center gap-[10px] lg:hidden">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="theme-chip rounded-[999px] px-[12px] py-[8px] font-diatype text-[11px] uppercase tracking-m3p transition"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="flex flex-col gap-[10px]">
                  <span className="theme-eyebrow font-diatype text-[12px] uppercase tracking-m3p">
                    Admin Dashboard
                  </span>
                  <h1 className="font-dmSans text-[42px] font-light leading-100 tracking-m3p max-md:text-[30px]">
                    {title}
                  </h1>
                  <p className="theme-page-muted max-w-[820px] font-dmSans text-[17px] leading-120 max-md:text-[15px]">
                    {description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-[10px]">
                <ThemeToggle />
                {actions}
                <AccountMenu />
              </div>
            </div>
          </header>

          {children}
        </div>
      </div>
    </section>
  );
};

export default AdminShell;
