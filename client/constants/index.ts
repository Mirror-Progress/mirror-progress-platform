export const navLinks = [
  {
    id: 1,
    text: 'What to do',
  },
  {
    id: 2,
    text: 'Get In Touch',
  },
];

export const footerLinks = [
  {
    id: 1,
    text: 'Term',
  },
  {
    id: 2,
    text: 'Privacy',
  },
];

export const socialMediaLinks = [
  {
    id: 1,
    text: 'Instagram',
  },
  {
    id: 2,
    text: 'Linkedin',
  },
];

export const offices = [
  {
    id: 0,
    text: 'San Francisco, CA',
  },
  {
    id: 1,
    text: 'Los Angeles, CA',
  },
  {
    id: 2,
    text: 'New York City, NY',
  },
];

export const capabilityBuckets = [
  {
    id: 'ai-systems-model-infrastructure',
    title: 'AI Systems & Model Infrastructure',
    excerpt:
      'RAG systems, agent orchestration, agent tools, inference infrastructure, fine-tuning, evaluation, intelligent workflows.',
    media: {
      imagePath: '/images/AI_Solutions.svg',
      videoPath: '/videos/Data_and_AI_Solutions.mp4',
    },
  },
  {
    id: 'data-platforms-backend-systems',
    title: 'Data Platforms & Backend Systems',
    excerpt:
      'APIs, ingestion pipelines, document processing, data normalization, internal tools, operational platforms.',
    media: {
      imagePath: '/images/Design_Engineering.svg',
      videoPath: '/videos/Design_Engineering.mp4',
    },
  },
  {
    id: 'web-infrastructure-digital-platforms',
    title: 'Web Infrastructure & Digital Platforms',
    excerpt:
      'Global websites, CMS architecture, frontend systems, multi-region delivery, performance engineering.',
    media: {
      imagePath: '/images/Smart_Infrastructure.svg',
      videoPath: '/videos/Smart_Infastructure.mp4',
    },
  },
  {
    id: 'research-analysis-technical-strategy',
    title: 'Research, Analysis & Technical Strategy',
    excerpt:
      'Original insight, technical analysis, architecture planning, system design, emerging technology research.',
    media: {
      imagePath: '/images/Sustainable_Futures.svg',
      videoPath: '/videos/Sustainable_Futures.mp4',
    },
  },
] as const;

export const heroDecorativeMarkers = [
  {
    id: 0,
    image: {
      path: '/images/AI_Solutions.svg',
    },
  },
  {
    id: 1,
    image: {
      path: '/images/Design_&_Experiences.svg',
    },
  },
  {
    id: 2,
    image: {
      path: '/images/Energy_Transformation.svg',
    },
  },
  {
    id: 3,
    image: {
      path: '/images/Design_Engineering.svg',
    },
  },
  {
    id: 4,
    image: {
      path: '/images/Smart_Infrastructure.svg',
    },
  },
];

export const paragraphs = {
  hero: 'We are a team of experts that partner closely with organizations who want to move ahead.',
  process: [
    'We begin all ventures by asking simple questions.',
    'We iterate to find the right solutions.',
    'We end with systems that scale and help our parterns expand.',
  ],
  capabilities:
    'We build the systems underneath ambitious organizations, from model infrastructure and data platforms to the websites and operational tools that keep everything moving.',
  footer:
    'Mirror Progress is a team of experts that partner closely with organizations who want to move ahead. We create internal and external products. We provide custom services. We are focused on what’s next. ',
};

export const icons = {
  white: {
    name: 'white',
    path: '/images/White.svg',
  },
  black: {
    name: 'white',
    path: '/images/Black.svg',
  },
  green: {
    name: 'white',
    path: '/images/Green.svg',
  },
  arrow: {
    name: 'arrow',
    path: '/images/arrow.svg',
  },
};

export const elipse = {
  name: 'Elipse',
  path: '/images/Elipse.svg',
};

export const policyText = [
  {
    id: 0,
    title: '1. Introduction',
    text: 'Mirror Progress values your privacy. This Privacy Policy explains how we collect, use, store, and protect the email addresses you provide to us, as well as your rights related to your personal information.',
    items: [],
  },
  {
    id: 1,
    title: '2. Information We Collect',
    text: 'We collect the following information when you voluntarily provide it to us:',
    items: [
      {
        id: 0,
        text: 'Email address',
      },
    ],
  },
  {
    id: 2,
    title: '3. How We Use Your Information',
    text: 'We use the email addresses we collect to:',
    items: [
      {
        id: 0,
        text: 'Send you newsletters, updates, and promotional materials.',
      },
      {
        id: 1,
        text: 'Communicate with you about our services or respond to your inquiries.',
      },
    ],
  },
  {
    id: 3,
    title: '4. How We Share Your Information',
    text: 'We do not sell, rent, or share your email address with third parties for their marketing purposes. We may share your information only:',
    items: [
      {
        id: 0,
        text: 'With service providers who assist us in delivering emails (e.g., email marketing platforms).',
      },
      {
        id: 1,
        text: 'As required by law or to comply with legal processes.',
      },
      {
        id: 2,
        text: 'If we are involved in a merger, acquisition, or sale of assets, in which case your information may be transferred to the new entity.',
      },
    ],
  },
  {
    id: 4,
    title: '5. How We Store and Protect Your Information',
    text: 'We implement reasonable security measures to protect your email address from unauthorized access, disclosure, or misuse. However, no system is completely secure, and we cannot guarantee absolute security.',
    items: [],
  },
  {
    id: 5,
    title: '6. Your Rights',
    text: 'Depending on your jurisdiction, you may have the following rights:',
    items: [
      {
        id: 0,
        text: 'Access and Update: Request access to or correction of your email address.',
      },
      {
        id: 1,
        text: 'Unsubscribe: Opt-out of receiving emails by clicking the "unsubscribe" link in any email we send.',
      },
      {
        id: 2,
        text: 'Deletion: Request that we delete your email address from our records.',
      },
    ],
    extraText:
      'To exercise your rights, contact us at hello@mirrorprogress.com',
  },
  {
    id: 6,
    title: '7. Cookies and Tracking Technologies',
    text: '[If applicable] Our website may use cookies or similar technologies to track your interaction with email sign-up forms. You can manage cookies through your browser settings.',
    items: [],
  },
  {
    id: 7,
    title: '8. Changes to This Privacy Policy',
    text: 'We may update this Privacy Policy from time to time. Changes will be posted on this page with the updated "Effective Date."',
    items: [],
  },
  {
    id: 8,
    title: '9. Contact Us',
    text: 'If you have any questions or concerns about this Privacy Policy or our practices, please contact us at:',
    items: [
      {
        id: 0,
        text: 'Mirror Progress LLC',
      },
      {
        id: 1,
        text: '47 Thames St. Brooklyn NY, 11237',
      },
      {
        id: 2,
        text: 'hello@mirrorprogress.com',
      },
    ],
  },
];

export const termsConditions = [
  {
    id: 0,
    title: '1. Introduction',
    text: 'These terms and conditions (the "Terms and Conditions") govern the use of www.mirrorprogress.com (the "Site"). This Site is owned and operated by Mirror Progress LLC. By using this Site, you indicate that you have read and understand these Terms and Conditions and agree to abide by them at all times.',
  },
  {
    id: 1,
    title: '2. Intellectual Property',
    text: "All content published and made available on our Site is the property of Mirror Progress LLC and the Site's creators. This includes, but is not limited to images, text, logos, documents, downloadable files and anything that contributes to the composition of our Site.",
  },
  {
    id: 2,
    title: '3. Links to Other Websites',
    text: 'Our Site contains links to third party websites or services that we do not own or control. We are not responsible for the content, policies, or practices of any third party website or service linked to on our Site. It is your responsibility to read the terms and conditions and privacy policies of these third party websites before using these sites.',
  },
  {
    id: 3,
    title: '4. Limitation of Liability',
    text: 'Mirror Progress LLC and our directors, officers, agents, employees, subsidiaries, and affiliates will not be liable for any actions, claims, losses, damages, liabilities and expenses including legal fees from your use of the Site.',
  },
  {
    id: 4,
    title: '5. Indemnity',
    text: 'Except where prohibited by law, by using this Site you indemnify and hold harmless Mirror Progress LLC and our directors, officers, agents, employees, subsidiaries, and affiliates from any actions, claims, losses, damages, liabilities and expenses including legal fees arising out of your use of our Site or your violation of these Terms and Conditions.',
  },
];

export const heroMP = {
  mirror: {
    alt: 'mirror',
    path: '/images/mirror.svg',
  },
  progress: {
    alt: 'progress',
    path: '/images/progress.svg',
  },
};
