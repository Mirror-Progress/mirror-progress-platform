import type { NextPage } from 'next';
import { Hero, Solutions, Process, Form, Footer } from '../components';

const Home: NextPage = () => {
  return (
    <>
      <Hero />
      <Solutions />
      <Process />
      <Form />
      <Footer />

      <div className="md:w-[3px] md:h-[136px] max-md:w-[176px] max-md:h-[3px] fixed z-10 md:top-[50%] md:translate-y-[-50%] md:left-[16px] md:flex md:flex-col md:justify-between">
        <div className="md:w-full md:h-[24px] bg-white">
          <div className="md:w-full md:h-[12px] "></div>
        </div>
        <div className="md:w-full md:h-[24px] bg-[#FFFFFF33]">
          <div className="md:w-full md:h-[12px] "></div>
        </div>
        <div className="md:w-full md:h-[24px] bg-[#FFFFFF33]">
          <div className="md:w-full md:h-[12px] "></div>
        </div>
        <div className="md:w-full md:h-[24px] bg-[#FFFFFF33]">
          <div className="md:w-full md:h-[12px] "></div>
        </div>
        <div className="md:w-full md:h-[24px] bg-[#FFFFFF33]">
          <div className="md:w-full md:h-[12px] "></div>
        </div>
      </div>
    </>
  );
};

export default Home;
