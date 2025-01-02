import React from 'react';

const Form: React.FC = () => {
  return (
    <section id="Form" className="h-screen  mb-[100px]">
      <div>
        <form action="" className="mx-auto w-[878px]">
          <h1 className="max-w-[515px]  text-center mx-auto text-[40px] ">
            Get in Touch
          </h1>
          <div>
            <input
              type="email"
              name="mail"
              className="block w-[463px] h-[57px] mx-auto mt-[64px] bg-[#284C4C] bg-opacity-[53] rounded-[24px]"
            />
            <input
              type="email"
              name="mail"
              className="block w-[877px] h-[150px] mx-auto mt-[12px] bg-[#284C4C] bg-opacity-[53] rounded-[51px]"
            />
          </div>
          <div>
            <div className="uppercase max-w-[348px] mx-auto text-center text-[14px] font-normal text-[#FFFFFF] mt-[24px]">
              Choose an office
            </div>
            <div className="w-[846px] h-[66px] rounded-[40px] bg-[#284C4C] mx-auto mt-[24px]"></div>
            <button className=" block mx-auto my-[26px] w-[132px] h-[36px] bg-[#FFFFFF] bg-opacity-15 rounded-[24px] text-[14px] font-normal border-[1px] border-[#FFFFFF] border-opacity-10">
              Send
            </button>
            <p className="uppercase max-w-[348px] mx-auto text-center text-[10px] font-normal text-[#A2A2A2]">
              By providing your email address, you consent to OUR{' '}
              <span className="text-[#FFFFFF]">PRIVACY POLICY </span>
              AND TO receive communications from MIRROR PROGRESS.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Form;
