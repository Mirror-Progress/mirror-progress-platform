import { capabilityBuckets } from '../constants';

export type ResearchType = 'whitepaper' | 'brief' | 'note' | 'perspective';
export type ResearchTone = 'ai' | 'data' | 'web' | 'strategy';
export type ResearchPdfTheme = 'dark' | 'light';

export interface ResearchAuthor {
  name: string;
  title: string;
}

export interface ResearchFigure {
  imagePath?: string;
  alt?: string;
  placeholderLabel?: string;
  caption: string;
  aspect?: 'wide' | 'square';
}

export type ResearchSection =
  | {
      id: string;
      type: 'lead' | 'paragraph';
      text: string;
    }
  | {
      id: string;
      type: 'heading';
      text: string;
      level?: 2 | 3;
    }
  | {
      id: string;
      type: 'bullets';
      title?: string;
      items: string[];
    }
  | {
      id: string;
      type: 'steps';
      title: string;
      items: Array<{
        title: string;
        body: string;
      }>;
    }
  | {
      id: string;
      type: 'callout';
      title: string;
      body: string;
      tone?: 'signal' | 'systems' | 'risk';
    }
  | {
      id: string;
      type: 'keyPoints';
      title: string;
      points: Array<{
        label: string;
        value: string;
        note?: string;
      }>;
    }
  | {
      id: string;
      type: 'quote';
      quote: string;
      attribution?: string;
    }
  | {
      id: string;
      type: 'figure';
      title: string;
      figure: ResearchFigure;
    }
  | {
      id: string;
      type: 'chart';
      title: string;
      caption: string;
      series: Array<{
        label: string;
        value: number;
        note?: string;
      }>;
    }
  | {
      id: string;
      type: 'table';
      title: string;
      columns: string[];
      rows: string[][];
    }
  | {
      id: string;
      type: 'comparison';
      title: string;
      columns: [string, string, string];
      rows: Array<{
        label: string;
        values: [string, string];
      }>;
    }
  | {
      id: string;
      type: 'stat';
      label: string;
      value: string;
      note?: string;
    };

export interface ResearchEntry {
  title: string;
  slug: string;
  subtitle: string;
  abstract: string;
  categoryId: (typeof capabilityBuckets)[number]['id'];
  publishDate: string;
  author: ResearchAuthor;
  readTime: string;
  tags: string[];
  featured?: boolean;
  type: ResearchType;
  tone: ResearchTone;
  cover: {
    eyebrow: string;
    kicker: string;
    figureLabel: string;
  };
  sections: ResearchSection[];
  relatedSlugs?: string[];
  cta?: {
    title: string;
    text: string;
    href: string;
    label: string;
  };
  pdf: {
    fileStem: string;
  };
}

const capabilityLabelById = new Map(
  capabilityBuckets.map((capability) => [capability.id, capability.title])
);

const mirrorProgressAttribution: ResearchAuthor = {
  name: 'Mirror Progress Research',
  title: 'Strategy and systems briefing desk',
};

export const researchEntries: ResearchEntry[] = [
  {
    title: 'Normalizing Operational Truth Across Disparate Business Systems',
    slug: 'normalizing-operational-truth-across-disparate-business-systems',
    subtitle:
      'A research brief on how agentic database normalization can help organizations reconcile fragmented records, align business functions, and create a unified operational data layer.',
    abstract:
      'How AI-assisted normalization can help organizations unify fragmented data across business functions, legacy tools, spreadsheets, documents, and operational workflows.',
    categoryId: 'data-platforms-backend-systems',
    publishDate: '2026-05-08',
    author: mirrorProgressAttribution,
    readTime: '7 min read',
    tags: [
      'AI systems',
      'data normalization',
      'business systems',
      'operational intelligence',
      'backend architecture',
      'agentic workflows',
    ],
    featured: true,
    type: 'brief',
    tone: 'data',
    cover: {
      eyebrow: 'Research brief',
      kicker: 'Data Platforms & Backend Systems',
      figureLabel: 'Operational truth map',
    },
    sections: [
      {
        id: 'lead',
        type: 'lead',
        text: 'Most organizations do not suffer from a lack of data. They suffer from a lack of shared structure.',
      },
      {
        id: 'opening',
        type: 'paragraph',
        text: 'Sales teams track customers one way. Operations teams manage fulfillment another way. Finance uses its own identifiers. Support teams create records around tickets, cases, and exceptions. Leadership receives summaries that often depend on manually reconciled spreadsheets, exported reports, and institutional memory. The result is not simply fragmented data. It is fragmented operational truth.',
      },
      {
        id: 'opening-2',
        type: 'paragraph',
        text: 'Agentic database normalization introduces a different approach. Instead of relying only on rigid migration scripts, manual cleanup, or one-time integrations, agentic systems can help identify entities, map fields, resolve inconsistencies, enrich records, and preserve the reasoning behind normalization decisions.',
      },
      {
        id: 'findings',
        type: 'keyPoints',
        title: 'Key findings',
        points: [
          {
            label: 'Failure point',
            value: 'Disparate systems',
            note: 'Business functions often define customers, projects, vendors, assets, and transactions differently.',
          },
          {
            label: 'Operational cost',
            value: 'Manual reconciliation',
            note: 'Teams recreate the same truth through spreadsheets, exports, status meetings, and one-off cleanup.',
          },
          {
            label: 'Most effective control',
            value: 'Agentic normalization layer',
            note: 'A governed AI-assisted layer can reconcile records while keeping humans in control of approval and governance.',
          },
        ],
      },
      {
        id: 'heading-core-problem',
        type: 'heading',
        text: 'The core problem: every department creates its own version of reality',
      },
      {
        id: 'core-problem',
        type: 'paragraph',
        text: 'Disjointed systems are not always a technology failure. They are often the natural result of business growth. A company adds a CRM, then project management, then finance tools, spreadsheets, support systems, document repositories, and internal applications. Each solves a real local problem. Over time, each becomes a partial source of truth.',
      },
      {
        id: 'core-problem-questions',
        type: 'bullets',
        title: 'Questions that become difficult to answer',
        items: [
          'Which customer record is the correct one?',
          'Has this vendor already been approved?',
          'Which project status is current?',
          'Which document belongs to which transaction?',
          'Which system should leadership trust?',
        ],
      },
      {
        id: 'heading-definition',
        type: 'heading',
        text: 'What agentic database normalization means',
      },
      {
        id: 'definition',
        type: 'paragraph',
        text: 'Agentic database normalization is the use of AI-driven agents to assist with transforming fragmented, inconsistent, and duplicated data into structured, reliable, and interoperable records. This does not mean letting AI freely rewrite company data. The agent assists with interpretation, comparison, and transformation, while system owners define schema, approval rules, fallback paths, and governance.',
      },
      {
        id: 'definition-steps',
        type: 'steps',
        title: 'Responsible normalization sequence',
        items: [
          {
            title: 'Ingest records from multiple systems',
            body: 'Collect records from business systems, uploads, APIs, spreadsheets, and documents while preserving source context.',
          },
          {
            title: 'Identify entities across different formats',
            body: 'Recognize likely customers, vendors, projects, employees, invoices, assets, or transactions across inconsistent records.',
          },
          {
            title: 'Detect duplicates and conflicts',
            body: 'Flag naming inconsistencies, missing fields, and competing identifiers before records are merged.',
          },
          {
            title: 'Map fields into a shared schema',
            body: 'Translate local system fields into canonical business fields that support operations and reporting.',
          },
          {
            title: 'Suggest normalized records',
            body: 'Generate proposed normalized outputs instead of silently rewriting source truth.',
          },
          {
            title: 'Flag uncertain matches for review',
            body: 'Low-confidence or high-impact changes should move into review instead of automatic merge.',
          },
          {
            title: 'Preserve decision history',
            body: 'Keep reasoning, change logs, and reviewer decisions visible for trust and auditability.',
          },
          {
            title: 'Write approved records into the operational layer',
            body: 'Publish approved normalized records into the structured data layer that powers reporting, tooling, AI retrieval, and workflows.',
          },
        ],
      },
      {
        id: 'heading-integration',
        type: 'heading',
        text: 'Why integration alone is not enough',
      },
      {
        id: 'integration',
        type: 'paragraph',
        text: 'Traditional integration focuses on moving data from one system to another. That is useful, but it does not automatically solve meaning. One tool may treat a company as a customer, another as a billing account, and another as a project sponsor. Moving all of that data into one place without normalization can simply centralize the confusion.',
      },
      {
        id: 'heading-layer',
        type: 'heading',
        text: 'The normalization layer',
      },
      {
        id: 'layer',
        type: 'steps',
        title: 'A governed normalization architecture',
        items: [
          {
            title: 'Source systems',
            body: 'CRMs, ERPs, spreadsheets, databases, ticketing tools, finance systems, documents, and internal applications remain the sources of raw operational signals.',
          },
          {
            title: 'Agentic processing layer',
            body: 'This layer performs entity recognition, field mapping, duplicate detection, schema alignment, conflict identification, enrichment, and confidence scoring.',
          },
          {
            title: 'Human review layer',
            body: 'Uncertain records, high-impact changes, and conflicting interpretations move through review workflows before they affect production truth.',
          },
          {
            title: 'Normalized data layer',
            body: 'Approved records are stored in structured form to support dashboards, internal tools, reporting, AI retrieval, workflow automation, and decision systems.',
          },
          {
            title: 'Operational interface',
            body: 'The business sees value only when teams can ask clear questions and receive trusted answers across business functions.',
          },
        ],
      },
      {
        id: 'systems-note',
        type: 'callout',
        tone: 'systems',
        title: 'Normalization is not just a data problem. It is an operating model problem.',
        body: 'The technical challenge is mapping fields. The organizational challenge is agreeing on meaning. A company has to decide what counts as a customer, which system has authority over financial records, how duplicates are resolved, and who approves uncertain changes. Without those decisions, AI can accelerate the mess.',
      },
      {
        id: 'heading-fragmentation',
        type: 'heading',
        text: 'Where fragmentation appears first',
      },
      {
        id: 'fragmentation',
        type: 'bullets',
        items: [
          'Customer and account records — The same customer may exist across sales, finance, support, and delivery systems with different names, contacts, addresses, and identifiers.',
          'Project and workflow status — Teams may use different status labels, making it difficult to understand whether work is planned, active, blocked, completed, invoiced, or archived.',
          'Vendor and partner data — Vendor records often become duplicated across procurement, finance, legal, and operations.',
          'Documents and attachments — Contracts, invoices, forms, reports, and correspondence may not be reliably connected to the correct operational record.',
          'Reporting and leadership visibility — Executives often receive information that has already passed through several manual transformations, making the source of truth difficult to trace.',
        ],
      },
      {
        id: 'heading-workflow',
        type: 'heading',
        text: 'Agentic normalization workflow',
      },
      {
        id: 'workflow',
        type: 'steps',
        title: 'Practical workflow stages',
        items: [
          {
            title: '1. Data intake',
            body: 'Collect records from business systems, uploads, APIs, spreadsheets, and documents while preserving source, timestamp, owner, and system context.',
          },
          {
            title: '2. Entity detection',
            body: 'Identify likely customers, vendors, projects, employees, invoices, assets, locations, or transactions.',
          },
          {
            title: '3. Schema mapping',
            body: 'Map fields from different systems into a shared data model.',
          },
          {
            title: '4. Similarity matching',
            body: 'Compare records that may refer to the same entity using names, emails, addresses, IDs, document references, transactions, and contextual clues.',
          },
          {
            title: '5. Conflict detection',
            body: 'Flag mismatched values, missing fields, competing identifiers, and records that cannot be confidently merged.',
          },
          {
            title: '6. Confidence scoring',
            body: 'Assign confidence to each suggested normalization action so low-confidence changes can be routed for review.',
          },
          {
            title: '7. Human approval',
            body: 'A reviewer confirms, rejects, or edits suggested normalized records to preserve trust, accountability, and compliance.',
          },
          {
            title: '8. Normalized record creation',
            body: 'Approved records are written into the structured data layer with traceability back to source records.',
          },
          {
            title: '9. Continuous learning',
            body: 'Review outcomes reveal naming patterns, field relationships, and exception types that improve the system over time.',
          },
        ],
      },
      {
        id: 'schema-mapping',
        type: 'table',
        title: 'Shared schema mapping example',
        columns: ['Source field', 'Normalized field'],
        rows: [
          ['Client Name', 'Account Name'],
          ['Customer', 'Account Name'],
          ['Company', 'Account Name'],
          ['Billing Entity', 'Legal Entity'],
          ['Project Lead', 'Internal Owner'],
          ['Deal Stage', 'Commercial Status'],
        ],
      },
      {
        id: 'figure',
        type: 'figure',
        title: 'Normalization layer diagram',
        figure: {
          imagePath: '/research/normalization.png',
          alt: 'Normalization layer diagram for disparate business systems',
          caption:
            'Normalization architecture showing the relationship between source systems, the agentic processing layer, human review, the normalized data layer, and the operational interface.',
          aspect: 'wide',
        },
      },
      {
        id: 'heading-unlocks',
        type: 'heading',
        text: 'What this unlocks',
      },
      {
        id: 'unlocks',
        type: 'bullets',
        items: [
          'Unified customer view — Teams can see a more complete picture of each customer across sales, delivery, finance, and support.',
          'Cleaner reporting — Leadership can make decisions from normalized records instead of manually reconciled spreadsheets.',
          'Better AI retrieval — AI systems perform better when the underlying data is structured, deduplicated, and semantically consistent.',
          'Workflow automation — Automations become safer when they operate on reliable records with clear ownership and state.',
          'Faster system migration — Companies preparing to move from legacy tools to modern platforms can reduce migration risk.',
          'Improved operational trust — Teams spend less time debating which system is correct and more time acting on shared information.',
        ],
      },
      {
        id: 'heading-requirements',
        type: 'heading',
        text: 'Design requirements for responsible agentic normalization',
      },
      {
        id: 'requirements',
        type: 'bullets',
        items: [
          'Source traceability — Every normalized record should link back to its original source records.',
          'Confidence thresholds — The system should distinguish between high-confidence matches and uncertain suggestions.',
          'Human review paths — Low-confidence or high-impact changes should require approval.',
          'Schema governance — The organization should define canonical fields, ownership rules, and acceptable transformations.',
          'Change history — Every merge, correction, field update, and reviewer action should be recorded.',
          'Rollback capability — Bad merges or incorrect transformations should be reversible.',
          'Business-language visibility — Users should understand what changed, why it changed, and which rule or source influenced the result.',
        ],
      },
      {
        id: 'heading-strategy',
        type: 'heading',
        text: 'Strategic implication',
      },
      {
        id: 'strategy',
        type: 'paragraph',
        text: 'Agentic database normalization changes the role of AI in business operations. Instead of only generating text or automating isolated tasks, AI can help create the structured foundation that makes the rest of digital transformation possible. The most valuable AI systems will not simply sit on top of company data. They will help reshape the data layer itself into something coherent, observable, and operationally useful.',
      },
      {
        id: 'quote',
        type: 'quote',
        quote:
          'The next phase of digital transformation is not only about connecting systems. It is about normalizing meaning across the business.',
        attribution: 'Mirror Progress Research',
      },
    ],
    relatedSlugs: [
      'the-case-for-business-owned-ai-compute',
      'stable-core-adaptive-surface',
    ],
    cta: {
      title: 'Need to unify fragmented systems into one operational view?',
      text: 'Mirror Progress helps organizations design structured data layers, agentic normalization workflows, and backend systems that connect disconnected tools into reliable operating infrastructure.',
      href: '/?skipIntro=contact#contact',
      label: 'Discuss a Data Systems Engagement',
    },
    pdf: {
      fileStem: 'mirror-progress-operational-truth-normalization',
    },
  },
  {
    title: 'The Case for Business-Owned AI Compute',
    slug: 'the-case-for-business-owned-ai-compute',
    subtitle:
      'A research brief on local inference, private model infrastructure, and the hybrid compute strategies businesses need as AI becomes operational infrastructure.',
    abstract:
      'Why organizations are beginning to evaluate owned AI compute, private inference, and hybrid model infrastructure as AI becomes part of daily operations.',
    categoryId: 'ai-systems-model-infrastructure',
    publishDate: '2026-05-06',
    author: mirrorProgressAttribution,
    readTime: '7 min read',
    tags: [
      'AI infrastructure',
      'local compute',
      'private inference',
      'model operations',
      'data sovereignty',
      'Apple silicon',
      'enterprise AI',
      'technical strategy',
    ],
    type: 'brief',
    tone: 'ai',
    cover: {
      eyebrow: 'Research brief',
      kicker: 'AI Systems & Model Infrastructure',
      figureLabel: 'Private compute strategy map',
    },
    sections: [
      {
        id: 'lead',
        type: 'lead',
        text: 'Cloud-hosted AI systems have made advanced model access simple. But as AI moves from experimentation into daily operations, a different question emerges: should every intelligent workflow depend entirely on external compute?',
      },
      {
        id: 'opening',
        type: 'paragraph',
        text: 'For many businesses, the answer will not be a full rejection of cloud AI. The more realistic future is hybrid. Cloud models remain valuable for frontier performance, elastic scale, and fast experimentation. Local compute infrastructure becomes valuable for privacy-sensitive workflows, predictable usage patterns, internal automation, model customization, and operational control.',
      },
      {
        id: 'findings',
        type: 'keyPoints',
        title: 'Key findings',
        points: [
          {
            label: 'Strategic shift',
            value: 'AI compute is becoming operational infrastructure',
            note: 'As AI becomes embedded in workflows, compute strategy becomes part of governance, cost control, and system architecture.',
          },
          {
            label: 'Primary business driver',
            value: 'Control',
            note: 'Local infrastructure gives organizations more control over data movement, model access, internal latency, and long-term cost behavior.',
          },
          {
            label: 'Most effective model',
            value: 'Hybrid compute architecture',
            note: 'Cloud for frontier capability and burst scale, local compute for private, repeatable, and operationally sensitive workloads.',
          },
        ],
      },
      {
        id: 'heading-cloud-local',
        type: 'heading',
        text: 'Cloud versus local is the wrong question',
      },
      {
        id: 'cloud-local',
        type: 'paragraph',
        text: 'The strategic issue is not whether cloud or local compute wins. The issue is whether businesses understand which parts of their AI operating layer should be rented, which parts should be owned, and which parts should remain portable.',
      },
      {
        id: 'heading-practicality',
        type: 'heading',
        text: 'Why local compute is becoming more practical',
      },
      {
        id: 'practicality',
        type: 'paragraph',
        text: 'Historically, local AI infrastructure required expensive GPU servers, specialized deployment knowledge, and heavy maintenance. That barrier is changing. Modern hardware with large unified memory pools, efficient local inference frameworks, and distributed runtimes has made smaller-scale private AI infrastructure more realistic. The important research point is not that one hardware stack is the universal answer. It is that local AI infrastructure is now credible enough for businesses to evaluate seriously.',
      },
      {
        id: 'heading-case',
        type: 'heading',
        text: 'The case for owned AI compute',
      },
      {
        id: 'case',
        type: 'steps',
        title: 'Why businesses evaluate local compute',
        items: [
          {
            title: '1. Data sovereignty',
            body: 'Some workflows involve customer records, financial documents, legal material, proprietary research, internal communications, or operational records that leaders do not want moving through third-party inference environments unless necessary.',
          },
          {
            title: '2. Predictable cost',
            body: 'Cloud AI is easy to start but can become difficult to forecast as usage grows. Local infrastructure changes the profile from variable operating expense to capital investment plus maintenance and support.',
          },
          {
            title: '3. Workflow resilience',
            body: 'A business that depends entirely on external AI APIs inherits availability, pricing, rate-limit, and policy changes from vendors. Local infrastructure creates a fallback layer.',
          },
          {
            title: '4. Customization',
            body: 'Local deployments give teams more freedom to test open models, fine-tune specialized systems, control retrieval pipelines, and integrate inference tightly with internal tools.',
          },
          {
            title: '5. Latency and proximity',
            body: 'For some workflows, especially internal agents or operational tools, reducing network dependency improves responsiveness and supports restricted environments.',
          },
        ],
      },
      {
        id: 'systems-note',
        type: 'callout',
        tone: 'systems',
        title: 'Local compute is not just a hardware decision',
        body: 'A business does not become AI-ready by buying machines. Local compute only becomes valuable when it is connected to a real operating model: which workloads run locally, which data cannot leave controlled infrastructure, which models are approved, who manages updates, and when the workflow should escalate to cloud or human review.',
      },
      {
        id: 'strategy-framework',
        type: 'table',
        title: 'A practical compute strategy framework',
        columns: ['Layer', 'Strategic question', 'Example decision'],
        rows: [
          [
            'Cloud frontier models',
            'When do we need the strongest external models?',
            'Complex reasoning, frontier capability, burst demand',
          ],
          [
            'Local inference',
            'Which repeatable workflows should stay private and predictable?',
            'Internal document review, structured extraction, classification, support automation',
          ],
          [
            'Retrieval and data layer',
            'Where does business context live?',
            'Private vector stores, normalized databases, document pipelines',
          ],
          [
            'Governance layer',
            'Who controls usage, review, fallback, and auditability?',
            'Approval paths, logging, escalation rules, model access policies',
          ],
        ],
      },
      {
        id: 'figure',
        type: 'figure',
        title: 'Hybrid compute portfolio',
        figure: {
          imagePath: '/research/compute.png',
          alt: 'Hybrid compute portfolio diagram for business-owned AI compute',
          caption:
            'Hybrid compute portfolio showing how cloud frontier models, local inference, retrieval infrastructure, and governance interact as one operating layer.',
          aspect: 'wide',
        },
      },
      {
        id: 'heading-local-fit',
        type: 'heading',
        text: 'Where local compute fits best',
      },
      {
        id: 'local-fit',
        type: 'bullets',
        items: [
          'Internal document intelligence — Summarizing, classifying, extracting, and routing internal files without sending every document to an external model.',
          'Repetitive operational workflows — Intake processing, ticket triage, record normalization, report generation, and compliance-review support.',
          'Private RAG systems — Retrieval over internal knowledge bases, policies, contracts, research archives, technical documents, and customer records.',
          'Development and testing — Teams can prototype workflows locally before deciding whether production should run on cloud, local infrastructure, or hybrid paths.',
          'Executive and regulated environments — Leadership, legal, finance, healthcare, defense-adjacent, and research-heavy organizations may value infrastructure control even when cloud remains part of the broader stack.',
        ],
      },
      {
        id: 'heading-not-fit',
        type: 'heading',
        text: 'Where local compute may not fit',
      },
      {
        id: 'not-fit',
        type: 'bullets',
        items: [
          'The business needs frontier model quality at all times.',
          'Usage is unpredictable and highly elastic.',
          'The team lacks infrastructure support.',
          'The workload requires uptime guarantees the company cannot maintain internally.',
          'The model ecosystem changes faster than the team can operate.',
          'The total cost of ownership is not clearly understood.',
        ],
      },
      {
        id: 'heading-requirements',
        type: 'heading',
        text: 'Design requirements for business-owned AI compute',
      },
      {
        id: 'requirements',
        type: 'bullets',
        items: [
          'Workload classification — Define which AI workloads are local-first, cloud-first, or hybrid.',
          'Model governance — Maintain approved models, version history, evaluation results, and usage rules.',
          'Data boundary rules — Identify what data can leave the organization and what must remain local.',
          'Observability — Track latency, throughput, errors, cost, utilization, and user activity.',
          'Fallback paths — Define when local inference should escalate to stronger cloud models or human review.',
          'Security controls — Manage access, logging, network exposure, secrets, and system updates.',
          'Evaluation process — Test local model performance against business tasks before relying on it operationally.',
          'Lifecycle planning — Account for hardware refresh cycles, model changes, framework updates, and maintenance.',
        ],
      },
      {
        id: 'heading-strategy',
        type: 'heading',
        text: 'Strategic implication',
      },
      {
        id: 'strategy',
        type: 'paragraph',
        text: 'AI compute is becoming a board-level infrastructure question. In the early phase of AI adoption, companies asked which model to use. In the next phase, stronger organizations will ask what compute architecture gives them the right balance of intelligence, control, cost, privacy, and resilience.',
      },
      {
        id: 'strategy-2',
        type: 'paragraph',
        text: 'Businesses that treat AI only as a software subscription may move quickly at first, but they risk building critical workflows on infrastructure they do not control. Businesses that overcorrect into fully local systems may gain control but lose access to the strongest frontier capabilities. The advantage belongs to organizations that can design a flexible compute layer: cloud when it provides leverage, local when control matters, hybrid when the workflow requires both.',
      },
      {
        id: 'quote',
        type: 'quote',
        quote:
          'The future of enterprise AI will not be purely cloud or purely local. It will belong to businesses that know which intelligence to rent, which infrastructure to own, and which workflows must remain portable.',
        attribution: 'Mirror Progress Research',
      },
    ],
    relatedSlugs: [
      'normalizing-operational-truth-across-disparate-business-systems',
      'stable-core-adaptive-surface',
    ],
    cta: {
      title: 'Planning your AI compute strategy?',
      text: 'Mirror Progress helps organizations evaluate local inference, private AI infrastructure, RAG systems, and hybrid compute architectures for operational AI workflows.',
      href: '/?skipIntro=contact#contact',
      label: 'Discuss an AI Infrastructure Engagement',
    },
    pdf: {
      fileStem: 'mirror-progress-business-owned-ai-compute',
    },
  },
  {
    title: 'Stable Core, Adaptive Surface',
    slug: 'stable-core-adaptive-surface',
    subtitle:
      'A technical note on adaptive interface systems, generative UI, and the architecture required to create fluid digital experiences without sacrificing trust.',
    abstract:
      'How AI-enabled interfaces can adapt to user context, task complexity, accessibility needs, and workflow state while preserving trust, predictability, and control.',
    categoryId: 'web-infrastructure-digital-platforms',
    publishDate: '2026-05-04',
    author: mirrorProgressAttribution,
    readTime: '7 min read',
    tags: [
      'adaptive interfaces',
      'AI interfaces',
      'UX systems',
      'generative UI',
      'accessibility',
      'human-computer interaction',
      'interface architecture',
    ],
    type: 'note',
    tone: 'web',
    cover: {
      eyebrow: 'Technical note',
      kicker: 'Web Infrastructure & Digital Platforms',
      figureLabel: 'Fluid interface map',
    },
    sections: [
      {
        id: 'lead',
        type: 'lead',
        text: 'Most digital products still expect users to adapt to the interface. The navigation is fixed. The dashboard is fixed. The information density is fixed. The workflow assumes the same user, context, intent, and expertise level every time.',
      },
      {
        id: 'opening',
        type: 'paragraph',
        text: 'Adaptive interface systems invert that relationship. Instead of forcing every user through the same digital surface, adaptive systems adjust the interface around task, context, user behavior, accessibility needs, and workflow state. The interface becomes less like a static screen and more like a responsive operating layer.',
      },
      {
        id: 'opening-2',
        type: 'paragraph',
        text: 'The opportunity is significant. AI-enabled systems can personalize layouts, reorder information, simplify workflows, highlight relevant actions, shift between modes, and support users with different levels of expertise. But adaptation introduces risk. When an interface changes too much, users lose orientation. When systems personalize without explanation, users lose trust.',
      },
      {
        id: 'findings',
        type: 'keyPoints',
        title: 'Key findings',
        points: [
          {
            label: 'Interface shift',
            value: 'From static screens to adaptive systems',
            note: 'Digital products are moving from fixed layouts toward interfaces that respond to user intent, context, task, and behavior.',
          },
          {
            label: 'Primary risk',
            value: 'Loss of predictability',
            note: 'An interface that adapts too aggressively can confuse users, disrupt muscle memory, and reduce trust.',
          },
          {
            label: 'Most effective control',
            value: 'Fluid experience architecture',
            note: 'Adaptive systems should preserve a stable core while allowing controlled transformation across layout, density, mode, content, and interaction patterns.',
          },
        ],
      },
      {
        id: 'heading-what-it-is',
        type: 'heading',
        text: 'What adaptive interface systems are',
      },
      {
        id: 'what-it-is',
        type: 'paragraph',
        text: 'An adaptive interface system is a digital interface that can change its structure, content, visual presentation, or interaction model based on user signals and contextual information. Those signals may include user role, task intent, experience level, device type, accessibility preferences, session behavior, workflow state, location, prior actions, and system confidence.',
      },
      {
        id: 'what-it-is-2',
        type: 'paragraph',
        text: 'The important distinction is that adaptive interfaces are not just personalized content. They are systems that change the operating surface of the product.',
      },
      {
        id: 'adaptation-levels',
        type: 'table',
        title: 'Three levels of interface adaptation',
        columns: ['Level', 'Description', 'Example'],
        rows: [
          [
            'Adaptability',
            'The user manually changes the interface',
            'Theme selection, layout preferences, accessibility controls',
          ],
          [
            'Adaptivity',
            'The system automatically changes the interface',
            'Recommended actions, reordered modules, context-aware layouts',
          ],
          [
            'Semi-automatic adaptation',
            'The system suggests changes and the user approves them',
            '“Switch to focus mode?” or “Use simplified workflow?”',
          ],
        ],
      },
      {
        id: 'heading-design-problem',
        type: 'heading',
        text: 'The central design problem',
      },
      {
        id: 'design-problem',
        type: 'paragraph',
        text: 'Adaptive interfaces create a tension between personalization and stability. A static interface is predictable but limited. A fully adaptive interface is responsive but potentially disorienting. The design challenge is deciding what should remain fixed and what should be allowed to change.',
      },
      {
        id: 'heading-framework',
        type: 'heading',
        text: 'Stable core, adaptive surface',
      },
      {
        id: 'framework',
        type: 'steps',
        title: 'The operating principle',
        items: [
          {
            title: 'Stable core',
            body: 'Primary navigation, critical actions, account controls, security and confirmation flows, system status, task progress, undo, recovery, and persistent user preferences should not move unpredictably.',
          },
          {
            title: 'Adaptive surface',
            body: 'Layout density, suggested actions, content priority, dashboard modules, guidance level, visual emphasis, workflow shortcuts, contextual explanations, and mode-based views can change based on user context.',
          },
        ],
      },
      {
        id: 'heading-dimensions',
        type: 'heading',
        text: 'Dimensions of adaptation',
      },
      {
        id: 'dimensions',
        type: 'steps',
        title: 'Where adaptive systems transform',
        items: [
          {
            title: '1. Information architecture',
            body: 'The system can prioritize, group, or reorder information based on task relevance.',
          },
          {
            title: '2. Visual density',
            body: 'The interface can shift between simplified, standard, and expert views.',
          },
          {
            title: '3. Interaction model',
            body: 'The interface can move between manual control, assisted control, and delegated control.',
          },
          {
            title: '4. Contextual mode',
            body: 'Products can shift between focus, review, collaboration, presentation, diagnostic, and recovery modes.',
          },
          {
            title: '5. Accessibility state',
            body: 'The interface can respond to contrast, spacing, motion reduction, assistive labeling, keyboard navigation, and alternate input needs.',
          },
          {
            title: '6. Trust and confidence state',
            body: 'When the system is uncertain, the interface should become more transparent by showing evidence, confidence, review prompts, and fallback paths.',
          },
        ],
      },
      {
        id: 'systems-note',
        type: 'callout',
        tone: 'systems',
        title: 'The interface becomes part of the intelligence layer',
        body: 'In AI-enabled products, intelligence does not only live in the model. It also lives in the interface: what the user sees, what the system explains, what action is recommended, when confidence is exposed, when control is handed back, and how risk is communicated.',
      },
      {
        id: 'heading-generative',
        type: 'heading',
        text: 'Why generative AI changes the interface problem',
      },
      {
        id: 'generative',
        type: 'paragraph',
        text: 'Traditional interfaces are assembled in advance. Generative AI introduces the possibility of dynamic interface assembly based on user intent, available data, business rules, task complexity, risk level, device context, user preference, and model confidence. That creates the possibility of a fluid interface, but only if the system is constrained.',
      },
      {
        id: 'grammar',
        type: 'bullets',
        title: 'A design-system grammar should define',
        items: [
          'Approved components',
          'Layout rules',
          'Spacing rules',
          'Accessibility requirements',
          'Color and contrast constraints',
          'Allowed interaction patterns',
          'Content hierarchy rules',
          'Animation limits',
          'Error-state patterns',
          'Confirmation requirements',
          'Role-based permissions',
        ],
      },
      {
        id: 'fluid-callout',
        type: 'callout',
        tone: 'signal',
        title: 'Fluid experience architecture',
        body: 'Fluid experience architecture is a Mirror Progress framing for adaptive interface systems that transform responsibly. It combines adaptive UI behavior, user modeling, context awareness, generative interface composition, design-system constraints, accessibility rules, user approval paths, and observability.',
      },
      {
        id: 'principles',
        type: 'steps',
        title: 'Principles of fluid experience architecture',
        items: [
          {
            title: '1. Stable core, adaptive surface',
            body: 'Critical navigation, status, confirmation, and recovery patterns should remain stable while supportive interface elements adapt.',
          },
          {
            title: '2. User-controlled transformation',
            body: 'Users should be able to approve, reject, pause, or reverse important interface changes.',
          },
          {
            title: '3. Progressive adaptation',
            body: 'The system should adapt gradually as it learns user preferences and as trust increases.',
          },
          {
            title: '4. Mode clarity',
            body: 'When the interface changes modes, the user should understand what changed and why.',
          },
          {
            title: '5. Reversibility',
            body: 'Users should always have a clear path back to the previous state.',
          },
          {
            title: '6. Task-first adaptation',
            body: 'The interface should adapt to improve task completion, clarity, speed, accessibility, or decision quality — not merely to appear intelligent.',
          },
          {
            title: '7. Privacy by design',
            body: 'Adaptive systems should minimize data collection, protect sensitive signals, and explain how personalization works.',
          },
          {
            title: '8. Evaluation loop',
            body: 'Adaptation should be measured against usability, task success, accessibility, error rate, user trust, and operational outcomes.',
          },
        ],
      },
      {
        id: 'figure',
        type: 'figure',
        title: 'Adaptive surface map',
        figure: {
          imagePath: '/research/adaptivesurface.png',
          alt: 'Adaptive surface map for stable core adaptive surface research note',
          caption:
            'Adaptive interface systems map showing the stable core, adaptive surface, mode indicators, approval controls, and trust signals within one governed interface architecture.',
          aspect: 'wide',
        },
      },
      {
        id: 'heading-value',
        type: 'heading',
        text: 'Where adaptive interfaces create value',
      },
      {
        id: 'value',
        type: 'bullets',
        items: [
          'Enterprise dashboards — Adaptive dashboards can shift between executive summary, operational review, and technical diagnostic views.',
          'Internal tools — Interfaces can reduce clutter by surfacing the right actions for each role.',
          'AI workflow systems — When AI confidence changes, the interface can expose evidence, review controls, escalation paths, and fallback actions.',
          'Learning and onboarding — New users can receive guided experiences while advanced users unlock denser controls and faster paths.',
          'Accessibility-sensitive products — Interfaces can adapt to user needs without requiring every setting to be configured manually.',
          'Agentic systems — Interfaces can shift between direct manipulation, assisted review, and delegated execution.',
        ],
      },
      {
        id: 'heading-danger',
        type: 'heading',
        text: 'The danger of over-adaptation',
      },
      {
        id: 'danger',
        type: 'bullets',
        items: [
          'The user cannot predict where controls will be.',
          'The interface changes without explanation.',
          'Personalization hides important information.',
          'AI-generated layouts violate accessibility standards.',
          'Users cannot undo adaptations.',
          'The system optimizes engagement instead of task success.',
          'Different users see different realities without governance.',
        ],
      },
      {
        id: 'heading-requirements',
        type: 'heading',
        text: 'Design requirements for adaptive interface systems',
      },
      {
        id: 'requirements',
        type: 'bullets',
        items: [
          'User model governance — Define what user data is collected, how it is stored, and how it influences interface changes.',
          'Adaptation boundaries — Document what the system is allowed to change.',
          'User approval controls — Allow users to accept, reject, undo, or disable adaptations.',
          'Mode indicators — Clearly show when the interface has entered a different state or mode.',
          'Stable navigation — Preserve critical controls and orientation paths.',
          'Accessibility validation — Ensure adapted experiences meet accessibility requirements.',
          'Explainability layer — Help users understand why a recommendation or interface change appeared.',
          'Performance monitoring — Measure whether adaptations improve outcomes or create friction.',
          'Fallback states — Provide a reliable static mode when adaptation fails.',
        ],
      },
      {
        id: 'heading-strategy',
        type: 'heading',
        text: 'Strategic implication',
      },
      {
        id: 'strategy',
        type: 'paragraph',
        text: 'The future of digital products is not just more intelligent backends. It is more intelligent surfaces. As AI systems become embedded inside software, the interface must become capable of explaining, guiding, adapting, and handing control back to the user at the right moment. The interface is no longer only a presentation layer. It becomes a decision layer, trust layer, accessibility layer, and operating layer.',
      },
      {
        id: 'strategy-2',
        type: 'paragraph',
        text: 'Businesses that understand this will build products that feel less static, less generic, and less burdensome. But the winning systems will not be the ones that change the most. They will be the ones that adapt with discipline.',
      },
      {
        id: 'quote',
        type: 'quote',
        quote:
          'The next generation of interfaces will not simply personalize content. They will adapt the operating surface of the product while preserving the user’s sense of control.',
        attribution: 'Mirror Progress Research',
      },
    ],
    relatedSlugs: [
      'normalizing-operational-truth-across-disparate-business-systems',
      'the-case-for-business-owned-ai-compute',
    ],
    cta: {
      title: 'Designing an adaptive digital platform?',
      text: 'Mirror Progress helps teams design interface systems, AI-enabled workflows, and adaptive digital products that balance personalization, usability, accessibility, and operational trust.',
      href: '/?skipIntro=contact#contact',
      label: 'Discuss an Interface Systems Engagement',
    },
    pdf: {
      fileStem: 'mirror-progress-stable-core-adaptive-surface',
    },
  },
];

export const researchWebThemeVars = {
  '--research-surface': 'var(--theme-research-surface)',
  '--research-surface-strong': 'var(--theme-research-surface-strong)',
  '--research-border': 'var(--theme-research-border)',
  '--research-text': 'var(--theme-research-text)',
  '--research-text-muted': 'var(--theme-research-text-muted)',
  '--research-accent': 'var(--theme-research-accent)',
  '--research-accent-soft': 'var(--theme-research-accent-soft)',
  '--research-callout': 'var(--theme-research-callout)',
  '--research-table-stripe': 'var(--theme-research-table-stripe)',
  '--research-shadow': 'var(--theme-research-shadow)',
} satisfies Record<string, string>;

const researchPdfThemeVarsByTheme: Record<
  ResearchPdfTheme,
  Record<string, string>
> = {
  dark: {
    '--research-surface': '#0a2628',
    '--research-surface-strong': '#071d20',
    '--research-border': 'rgba(255, 255, 255, 0.12)',
    '--research-text': '#f7fbfb',
    '--research-text-muted': 'rgba(247, 251, 251, 0.72)',
    '--research-accent': '#bbf0f0',
    '--research-accent-soft': 'rgba(187, 240, 240, 0.12)',
    '--research-callout': 'rgba(255, 255, 255, 0.05)',
    '--research-table-stripe': 'rgba(255, 255, 255, 0.03)',
    '--research-shadow': '0 20px 60px rgba(0, 0, 0, 0.16)',
  },
  light: {
    '--research-surface': '#f7fbff',
    '--research-surface-strong': '#ffffff',
    '--research-border': 'rgba(118, 165, 230, 0.32)',
    '--research-text': '#18325f',
    '--research-text-muted': 'rgba(24, 50, 95, 0.72)',
    '--research-accent': '#0bbbd7',
    '--research-accent-soft': 'rgba(11, 187, 215, 0.1)',
    '--research-callout': 'rgba(11, 58, 145, 0.04)',
    '--research-table-stripe': 'rgba(17, 74, 162, 0.04)',
    '--research-shadow': '0 22px 62px rgba(19, 60, 131, 0.12)',
  },
};

export function getResearchPdfThemeVars(theme: ResearchPdfTheme) {
  return researchPdfThemeVarsByTheme[theme];
}

export function formatResearchDate(isoDate: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(isoDate));
}

export function getAllResearchEntries() {
  return [...researchEntries].sort((a, b) =>
    a.publishDate < b.publishDate ? 1 : -1
  );
}

export function getResearchBySlug(slug: string) {
  return researchEntries.find((entry) => entry.slug === slug) ?? null;
}

export function getFeaturedResearchEntry() {
  return getAllResearchEntries().find((entry) => entry.featured) ?? null;
}

export function getRelatedResearchEntries(entry: ResearchEntry, limit = 2) {
  const explicit = (entry.relatedSlugs ?? [])
    .map((slug) => getResearchBySlug(slug))
    .filter((candidate): candidate is ResearchEntry => Boolean(candidate));

  if (explicit.length >= limit) {
    return explicit.slice(0, limit);
  }

  const fallback = getAllResearchEntries().filter(
    (candidate) =>
      candidate.slug !== entry.slug &&
      candidate.categoryId === entry.categoryId &&
      !explicit.some((related) => related.slug === candidate.slug)
  );

  return [...explicit, ...fallback].slice(0, limit);
}

export function getResearchCategoryLabel(categoryId: ResearchEntry['categoryId']) {
  return capabilityLabelById.get(categoryId) ?? 'Mirror Progress Research';
}

export function getResearchPdfHref(slug: string, theme: ResearchPdfTheme) {
  return `/research/${slug}/pdf?theme=${theme}`;
}
