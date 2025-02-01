// pages/_app.tsx

import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Layout from '../components/Layout';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/images/mirror.svg" />

        {/* Open Graph / Social Sharing Meta Tags */}
        <meta property="og:title" content="Mirror Progress" />
        <meta
          property="og:description"
          content="Mirror Progress provides expert consulting and digital transformation services to help organizations innovate and thrive. Learn how our experienced team can drive your business forward."
        />
        <meta property="og:image" content="/images/graphimage.png" />
        <meta property="og:url" content="https://mirrorprogress.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Mirror Progress" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mirror Progress" />
        <meta
          name="twitter:description"
          content="Mirror Progress provides expert consulting and digital transformation services to help organizations innovate and thrive. Learn how our experienced team can drive your business forward."
        />
        <meta name="twitter:image" content="/images/graphimage.png" />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

export default MyApp;
