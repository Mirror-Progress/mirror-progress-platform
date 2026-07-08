import { ObjectId } from 'mongodb';
import { getDb } from './mongodb';

export type InboundLeadStatus = 'new' | 'reviewed' | 'archived';
export type InboundLeadEmailNotification = 'sent' | 'not_configured' | 'failed';

export type InboundLeadAttribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  referrer: string | null;
  landingPath: string | null;
};

export type InboundLeadRecord = {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string;
  companyEmail: string;
  companySize: string;
  industry: string;
  howDidYouHearAboutUs: string;
  message: string;
  attribution: InboundLeadAttribution;
  status: InboundLeadStatus;
  emailNotification: InboundLeadEmailNotification;
  emailNotificationWarning: string | null;
  createdAt: string;
  updatedAt: string;
};

type InboundLeadDocument = Omit<InboundLeadRecord, 'id'> & {
  _id: ObjectId;
};

export type CreateInboundLeadInput = {
  firstName?: unknown;
  lastName?: unknown;
  companyName?: unknown;
  companyEmail?: unknown;
  email?: unknown;
  companySize?: unknown;
  industry?: unknown;
  howDidYouHearAboutUs?: unknown;
  message?: unknown;
  attribution?: Partial<Record<keyof InboundLeadAttribution, unknown>>;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asString(value: unknown) {
  return `${value ?? ''}`.trim();
}

function nullableString(value: unknown) {
  const next = asString(value);
  return next || null;
}

function sanitizeLongText(value: unknown, maxLength = 5000) {
  return asString(value).slice(0, maxLength);
}

function collection() {
  return getDb().then((db) => db.collection<InboundLeadDocument>('inbound_leads'));
}

function stripMongoId(document: InboundLeadDocument): InboundLeadRecord {
  const { _id, ...record } = document;
  return {
    id: _id.toString(),
    ...record,
  };
}

export function normalizeInboundLeadInput(input: CreateInboundLeadInput) {
  const companyEmail = asString(input.companyEmail) || asString(input.email);
  const message = sanitizeLongText(input.message);

  if (!emailPattern.test(companyEmail)) {
    throw new Error('A valid company email is required.');
  }

  if (!message) {
    throw new Error('A message is required.');
  }

  return {
    firstName: asString(input.firstName),
    lastName: asString(input.lastName),
    companyName: asString(input.companyName),
    companyEmail,
    companySize: asString(input.companySize),
    industry: asString(input.industry),
    howDidYouHearAboutUs: asString(input.howDidYouHearAboutUs),
    message,
    attribution: {
      utmSource: nullableString(input.attribution?.utmSource),
      utmMedium: nullableString(input.attribution?.utmMedium),
      utmCampaign: nullableString(input.attribution?.utmCampaign),
      utmContent: nullableString(input.attribution?.utmContent),
      utmTerm: nullableString(input.attribution?.utmTerm),
      referrer: nullableString(input.attribution?.referrer),
      landingPath: nullableString(input.attribution?.landingPath),
    },
  };
}

export async function createInboundLead(input: CreateInboundLeadInput) {
  const normalized = normalizeInboundLeadInput(input);
  const now = new Date().toISOString();
  const leads = await collection();

  await leads.createIndex({ createdAt: -1 });
  await leads.createIndex({ companyEmail: 1, createdAt: -1 });

  const result = await leads.insertOne({
    _id: new ObjectId(),
    ...normalized,
    status: 'new',
    emailNotification: 'not_configured',
    emailNotificationWarning: null,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: result.insertedId.toString(),
    ...normalized,
    status: 'new' as const,
    emailNotification: 'not_configured' as const,
    emailNotificationWarning: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateInboundLeadEmailNotification(
  leadId: string,
  emailNotification: InboundLeadEmailNotification,
  warning?: string
) {
  const leads = await collection();
  await leads.updateOne(
    { _id: new ObjectId(leadId) },
    {
      $set: {
        emailNotification,
        emailNotificationWarning: warning?.slice(0, 1000) ?? null,
        updatedAt: new Date().toISOString(),
      },
    }
  );
}

export async function listInboundLeads(input?: { limit?: number }) {
  const leads = await collection();
  const limit = Math.min(Math.max(input?.limit ?? 100, 1), 250);
  const records = await leads
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return records.map(stripMongoId);
}
