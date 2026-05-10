import Head from 'next/head';
import type { GetServerSideProps, NextPage } from 'next';
import ResearchPdfDocument from '../../../components/research/ResearchPdfDocument';
import {
  type ResearchEntry,
  type ResearchPdfTheme,
  getResearchBySlug,
} from '../../../lib/research';

interface ResearchPdfPageProps {
  entry: ResearchEntry;
  theme: ResearchPdfTheme;
}

const ResearchPdfPage: NextPage<ResearchPdfPageProps> = ({ entry, theme }) => {
  return (
    <>
      <Head>
        <title>{`${entry.title} PDF | Mirror Progress`}</title>
        <meta
          name="description"
          content={`Print-ready ${theme} PDF view for ${entry.title}.`}
        />
      </Head>
      <ResearchPdfDocument entry={entry} theme={theme} />
    </>
  );
};

export const getServerSideProps: GetServerSideProps<ResearchPdfPageProps> = async (
  context
) => {
  const slug = String(context.params?.slug ?? '');
  const entry = getResearchBySlug(slug);

  if (!entry) {
    return { notFound: true };
  }

  const theme: ResearchPdfTheme =
    context.query.theme === 'light' ? 'light' : 'dark';

  return {
    props: {
      entry,
      theme,
    },
  };
};

export default ResearchPdfPage;
