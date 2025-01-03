// components/Layout.tsx

import React from 'react';
// import Header from './Header';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <main className="relative">{children}</main>;
};

export default Layout;
