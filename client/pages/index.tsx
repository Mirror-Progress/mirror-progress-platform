// client/pages/index.tsx

import type { NextPage } from "next";
import Head from "next/head";
import ContactForm from "../components/ContactForm";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  return (
    <div className={styles.container + " flex flex-col items-center justify-center min-h-screen bg-gray-100"}>
      <Head>
        <title>Mirror Progress</title>
        <meta name="description" content="Mirror Progress Platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main + " flex flex-col items-center justify-center w-full flex-1 px-20 text-center"}>
        <h1 className={styles.title + " text-4xl font-bold mb-8"}>Welcome to Mirror Progress</h1>
      </main>
    </div>
  );
};

export default Home;
