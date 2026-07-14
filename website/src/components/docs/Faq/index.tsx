import type { ReactNode } from 'react';
import Head from '@docusaurus/Head';

export type FaqItem = {
  question: string;
  answer: string;
};

export const Faq = ({ items }: { items: FaqItem[] }): ReactNode => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <>
      <Head>
        <script type='application/ld+json'>{JSON.stringify(jsonLd)}</script>
      </Head>
      <hr />
      <section className='lagune-faq'>
        <h2 id='faq'>Frequently Asked Questions</h2>
        {items.map((item) => (
          <div key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </div>
        ))}
      </section>
    </>
  );
};
