import type { NextPage } from 'next';
import { Hero, Solutions, Process, Form, Footer } from '../components';

const Home: NextPage = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
      window.location.reload();
    });
  }
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
