import type { GetServerSideProps, NextPage } from 'next';

const RobotsTxt: NextPage = () => null;

function getSiteUrl() {
  return `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mirrorprogress.com'}`.replace(/\/+$/, '');
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const siteUrl = getSiteUrl();
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /workspace',
    'Disallow: /account',
    'Disallow: /api',
    'Disallow: /capabilities',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.write(body);
  res.end();

  return { props: {} };
};

export default RobotsTxt;
