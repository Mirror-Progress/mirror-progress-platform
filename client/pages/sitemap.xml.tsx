import type { GetServerSideProps, NextPage } from 'next';
import { getAllResearchEntries } from '../lib/research';

const SitemapXml: NextPage = () => null;

type SitemapUrl = {
  loc: string;
  lastmod?: string;
  priority: string;
};

function getSiteUrl() {
  return `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mirrorprogress.com'}`.replace(/\/+$/, '');
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const siteUrl = getSiteUrl();
  const researchEntries = getAllResearchEntries();
  const urls: SitemapUrl[] = [
    { loc: `${siteUrl}/`, priority: '1.0' },
    { loc: `${siteUrl}/research`, priority: '0.8' },
    ...researchEntries.map((entry) => ({
      loc: `${siteUrl}/research/${entry.slug}`,
      lastmod: entry.publishDate,
      priority: '0.7',
    })),
  ];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) =>
      [
        '  <url>',
        `    <loc>${escapeXml(url.loc)}</loc>`,
        url.lastmod ? `    <lastmod>${escapeXml(url.lastmod)}</lastmod>` : '',
        `    <priority>${url.priority}</priority>`,
        '  </url>',
      ].filter(Boolean).join('\n')
    ),
    '</urlset>',
    '',
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.write(body);
  res.end();

  return { props: {} };
};

export default SitemapXml;
