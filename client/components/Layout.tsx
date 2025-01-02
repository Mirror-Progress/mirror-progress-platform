// components/Layout.tsx

import React from 'react';
// import Header from './Header';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {/* <Header /> */}
      <main className="basic-pd">{children}</main>
    </>
  );
};

export default Layout;
