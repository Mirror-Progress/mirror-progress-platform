import { Menu } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

interface AccountMenuProps {
  className?: string;
  textColorClassName?: string;
  dropdownAlign?: 'left' | 'right';
}

const MENU_WIDTH = 240;
const VIEWPORT_PADDING = 16;
const allowPublicSignup =
  process.env.NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP?.toLowerCase() === 'true';

interface AccountMenuDropdownProps {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  dropdownAlign: 'left' | 'right';
  isLoading: boolean;
  isInternalUser: boolean;
  displayName: string;
  displayCompany: string;
  displayRole: string;
  logout: () => Promise<void>;
  openAuth: (mode: 'login' | 'signup') => void;
  userPresent: boolean;
}

const AccountMenuDropdown: React.FC<AccountMenuDropdownProps> = ({
  buttonRef,
  dropdownAlign,
  isLoading,
  isInternalUser,
  displayName,
  displayCompany,
  displayRole,
  logout,
  openAuth,
  userPresent,
}) => {
  const [position, setPosition] = useState({ left: VIEWPORT_PADDING, top: 0 });

  useEffect(() => {
    const updatePosition = () => {
      const button = buttonRef.current;

      if (!button) {
        return;
      }

      const rect = button.getBoundingClientRect();
      const preferredLeft =
        dropdownAlign === 'left'
          ? rect.left
          : rect.right - MENU_WIDTH;
      const nextLeft = Math.min(
        Math.max(VIEWPORT_PADDING, preferredLeft),
        window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING
      );

      setPosition({
        left: nextLeft,
        top: rect.bottom + 10,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [buttonRef, dropdownAlign]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <Menu.Items
      className="theme-panel-strong fixed z-[120] min-w-[220px] rounded-[24px] p-[8px] focus:outline-none"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${MENU_WIDTH}px`,
      }}
    >
      {isLoading ? (
        <div className="theme-eyebrow px-[14px] py-[12px] font-diatype text-[12px] uppercase tracking-m3p">
          Loading…
        </div>
      ) : userPresent ? (
        <>
          <div className="theme-divider border-b px-[14px] py-[12px]">
            <p className="font-dmSans text-[18px] leading-100">
              {displayName}
            </p>
            <p className="theme-eyebrow mt-[8px] font-diatype text-[12px] uppercase tracking-m3p">
              {displayCompany}
            </p>
            <p className="theme-page-subtle mt-[6px] font-diatype text-[11px] uppercase tracking-m3p">
              {displayRole}
            </p>
          </div>

          {isInternalUser ? (
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/admin"
                  className={`flex rounded-[18px] px-[14px] py-[12px] font-diatype text-[12px] uppercase tracking-m3p transition ${
                    active ? 'theme-card' : ''
                  }`}
                >
                  Admin Dashboard
                </Link>
              )}
            </Menu.Item>
          ) : (
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/workspace"
                  className={`flex rounded-[18px] px-[14px] py-[12px] font-diatype text-[12px] uppercase tracking-m3p transition ${
                    active ? 'theme-card' : ''
                  }`}
                >
                  Client Workspace
                </Link>
              )}
            </Menu.Item>
          )}
          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                onClick={() => void logout()}
                className={`flex w-full rounded-[18px] px-[14px] py-[12px] text-left font-diatype text-[12px] uppercase tracking-m3p transition ${
                  active ? 'theme-card' : ''
                }`}
              >
                Logout
              </button>
            )}
          </Menu.Item>
        </>
      ) : (
        <>
          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                onClick={() => openAuth('login')}
                className={`flex w-full rounded-[18px] px-[14px] py-[12px] text-left font-diatype text-[12px] uppercase tracking-m3p transition ${
                  active ? 'theme-card' : ''
                }`}
              >
                Login
              </button>
            )}
          </Menu.Item>
          {allowPublicSignup ? (
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => openAuth('signup')}
                  className={`flex w-full rounded-[18px] px-[14px] py-[12px] text-left font-diatype text-[12px] uppercase tracking-m3p transition ${
                    active ? 'theme-card' : ''
                  }`}
                >
                  Signup
                </button>
              )}
            </Menu.Item>
          ) : null}
        </>
      )}
    </Menu.Items>,
    document.body
  );
};

const AccountMenu: React.FC<AccountMenuProps> = ({
  className = '',
  textColorClassName = 'text-white',
  dropdownAlign = 'right',
}) => {
  const { isLoading, logout, openAuth, user } = useAuth();
  const { theme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const isInternalUser =
    user?.role === 'super_admin' ||
    user?.role === 'admin' ||
    user?.role === 'project_lead';

  const displayName = user?.name?.trim() || 'Mirror Progress Account';
  const displayCompany = user?.company?.trim() || 'Mirror Progress';
  const displayRole = user?.role
    ? user.role
        .split('_')
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ')
    : 'Client';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join('');

  return (
    <Menu as="div" className={`relative ${className}`}>
      {({ open }) => (
        <>
          <Menu.Button
            ref={buttonRef}
            className={`theme-secondary-button inline-flex items-center gap-[10px] rounded-[999px] px-[10px] py-[8px] font-diatype text-[12px] uppercase tracking-m3p ${textColorClassName}`}
            aria-label={user ? 'Open account menu' : 'Open login and signup menu'}
          >
            <span
              className={`inline-flex h-[28px] w-[28px] items-center justify-center rounded-full border ${
                user
                  ? 'theme-primary-button border-transparent'
                  : 'border-[color:var(--theme-chip-border)] bg-transparent text-[color:var(--theme-page-text-subtle)]'
              }`}
            >
              {user ? initials || 'MP' : ''}
            </span>
            <ChevronDownIcon
              className="h-[14px] w-[14px]"
              style={{
                color:
                  theme === 'light'
                    ? 'rgba(20, 53, 116, 0.72)'
                    : 'rgba(255, 255, 255, 0.7)',
              }}
            />
          </Menu.Button>

          {open ? (
            <AccountMenuDropdown
              buttonRef={buttonRef}
              dropdownAlign={dropdownAlign}
              isLoading={isLoading}
              isInternalUser={isInternalUser}
              displayName={displayName}
              displayCompany={displayCompany}
              displayRole={displayRole}
              logout={logout}
              openAuth={openAuth}
              userPresent={Boolean(user)}
            />
          ) : null}
        </>
      )}
    </Menu>
  );
};

export default AccountMenu;
