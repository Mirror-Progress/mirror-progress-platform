// client/pages/index.tsx

import type { NextPage } from 'next';
import { Header, Hero, Solutions, Process, Form, Footer } from '../components';

const Home: NextPage = () => {
  return (
    <>
      <Hero />
      <Solutions />
      <Process />
      <Form />
      <Footer />
    </>
  );
};

export default Home;
