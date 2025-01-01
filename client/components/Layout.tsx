// components/Layout.tsx

import React from 'react';
// import Header from './Header';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {/* <Header /> */}
      <main className="mx-[24px]">{children}</main>
    </>
  );
};

export default Layout;
