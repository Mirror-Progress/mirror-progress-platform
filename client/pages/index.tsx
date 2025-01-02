// client/pages/index.tsx

import type { NextPage } from 'next';
import { Header, Hero, Solutions, Process, Form, Footer } from '../components';

const Home: NextPage = () => {
  console.log(Hero);
  return (
    <>
      <Header />
      <Hero />
      <Solutions />
      <Process />
      <Form />
      <Footer />
    </>
  );
  // <div
  //   className={
  //     ' flex flex-col items-center justify-center min-h-screen bg-gray-100'
  //   }
  // >
  //   <Head>
  //     <title>Mirror Progress</title>
  //     <meta name="description" content="Mirror Progress Platform" />
  //     <link rel="icon" href="/favicon.ico" />
  //   </Head>

  //   <main
  //     className={
  //       ' flex flex-col items-center justify-center w-full flex-1 px-20 text-center'
  //     }
  //   >
  //     <h1 className={'text-4xl font-bold mb-8'}>
  //       We are a team of experts that partner closely with organizations who
  //       want to move ahead.
  //     </h1>
  //   </main>
  // </div>
};

export default Home;
