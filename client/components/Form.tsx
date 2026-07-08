import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { policyText } from '../constants';

type ContactFormState = {
  firstName: string;
  lastName: string;
  companyName: string;
  companyEmail: string;
  companySize: string;
  industry: string;
  howDidYouHearAboutUs: string;
  message: string;
};

type AttributionState = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  referrer: string | null;
  landingPath: string | null;
};

const initialFormState: ContactFormState = {
  firstName: '',
  lastName: '',
  companyName: '',
  companyEmail: '',
  companySize: '',
  industry: '',
  howDidYouHearAboutUs: '',
  message: '',
};

const companySizes = [
  '1-20 employees',
  '21-75 employees',
  '76-300 employees',
  '301-1,000 employees',
  '1,000+ employees',
];

const industries = [
  'Architecture / Design',
  'Engineering / Infrastructure',
  'Trade Association',
  'Construction / Real Estate',
  'Professional Services',
  'Manufacturing',
  'Utilities / Public Works',
  'Other',
];

const sourceOptions = [
  'LinkedIn',
  'Referral',
  'Berkeley / Haas',
  'Research article',
  'Press / announcement',
  'Google / search',
  'Other',
];

const inputClasses =
  'theme-input-field min-h-[58px] w-full rounded-[24px] px-[20px] py-[16px] font-diatype text-[14px] leading-120 tracking-m3p';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="theme-eyebrow mb-[8px] block font-diatype text-[11px] uppercase tracking-m3p">
      {children}
    </label>
  );
}

const Form: React.FC = () => {
  const router = useRouter();
  const [form, setForm] = useState<ContactFormState>(initialFormState);
  const [attribution, setAttribution] = useState<AttributionState>({
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    referrer: null,
    landingPath: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPolicy, setShowPolicy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAttribution({
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
      utmContent: params.get('utm_content'),
      utmTerm: params.get('utm_term'),
      referrer: document.referrer || null,
      landingPath: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    });
  }, []);

  const canSubmit = useMemo(
    () =>
      form.firstName.trim() &&
      form.lastName.trim() &&
      form.companyName.trim() &&
      isValidEmail(form.companyEmail) &&
      form.companySize &&
      form.industry &&
      form.howDidYouHearAboutUs &&
      form.message.trim(),
    [form]
  );

  const updateField =
    (field: keyof ContactFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!canSubmit || submitting) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/sendMail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          attribution,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Unable to submit the form.');
      }

      await router.push('/thank-you?conversion=contact');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'There was an error sending your message. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="Form"
      className="theme-page min-h-screen w-full basic-pd max-md:mb-0 lg:pt-[40px] lg:pb-[120px] max-md:pt-[16px] max-md:pb-[88px]"
    >
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center py-[70px]">
        <form className="theme-panel w-full rounded-[44px] px-[28px] py-[32px] max-md:rounded-[28px] max-md:px-[18px]" onSubmit={handleSubmit}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="theme-eyebrow font-diatype text-[12px] uppercase tracking-m3p">
              [ Start here ]
            </p>
            <h1 className="mt-[14px] font-dmSans text-[42px] font-light leading-100 tracking-m3p text-[color:var(--theme-brand-ink)] max-md:text-[32px]">
              Start a readiness conversation
            </h1>
            <p className="theme-page-muted mt-[14px] font-dmSans text-[17px] leading-125 max-md:text-[15px]">
              Tell us what is slowing down your data, workflows, reporting, or AI
              plans. We will use this to understand whether an AI Readiness Audit
              is the right first move.
            </p>
          </div>

          <div className="mt-[30px] grid gap-[16px] md:grid-cols-2">
            <div>
              <FieldLabel>First name</FieldLabel>
              <input
                className={inputClasses}
                value={form.firstName}
                onChange={updateField('firstName')}
                autoComplete="given-name"
                required
              />
            </div>
            <div>
              <FieldLabel>Last name</FieldLabel>
              <input
                className={inputClasses}
                value={form.lastName}
                onChange={updateField('lastName')}
                autoComplete="family-name"
                required
              />
            </div>
            <div>
              <FieldLabel>Company name</FieldLabel>
              <input
                className={inputClasses}
                value={form.companyName}
                onChange={updateField('companyName')}
                autoComplete="organization"
                required
              />
            </div>
            <div>
              <FieldLabel>Company email</FieldLabel>
              <input
                className={inputClasses}
                type="email"
                value={form.companyEmail}
                onChange={updateField('companyEmail')}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <FieldLabel>Company size</FieldLabel>
              <select
                className={inputClasses}
                value={form.companySize}
                onChange={updateField('companySize')}
                required
              >
                <option value="">Select size</option>
                {companySizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Industry</FieldLabel>
              <select
                className={inputClasses}
                value={form.industry}
                onChange={updateField('industry')}
                required
              >
                <option value="">Select industry</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <FieldLabel>How did you hear about us?</FieldLabel>
              <select
                className={inputClasses}
                value={form.howDidYouHearAboutUs}
                onChange={updateField('howDidYouHearAboutUs')}
                required
              >
                <option value="">Select one</option>
                {sourceOptions.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <FieldLabel>What is the bottleneck?</FieldLabel>
              <textarea
                className={`${inputClasses} min-h-[160px] resize-none`}
                value={form.message}
                onChange={updateField('message')}
                placeholder="Example: our knowledge is spread across PDFs, SharePoint, and old reports, and leadership wants to know what needs to change before AI can be useful."
                maxLength={5000}
                required
              />
              <p className="theme-page-subtle mt-[8px] text-right font-diatype text-[10px] uppercase tracking-m3p">
                {form.message.trim().split(/\s+/).filter(Boolean).length}/500 words
              </p>
            </div>
          </div>

          {error ? (
            <p className="mt-[18px] rounded-[18px] border border-[#A86161]/30 bg-[#332222] px-[14px] py-[12px] font-diatype text-[12px] uppercase tracking-m3p text-[#F2C6C6]">
              {error}
            </p>
          ) : null}

          <div className="mt-[24px] flex flex-wrap items-center justify-center gap-[14px]">
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className={`min-h-[48px] rounded-[999px] px-[24px] py-[13px] font-inter text-[14px] font-normal capitalize transition ${
                canSubmit && !submitting
                  ? 'theme-primary-button hover:cursor-pointer'
                  : 'theme-secondary-button cursor-not-allowed opacity-60'
              }`}
            >
              {submitting ? 'Sending...' : 'Start the Conversation'}
            </button>
            <p className="theme-page-muted max-w-[420px] text-center font-diatype text-[10px] font-medium uppercase leading-130 tracking-m3p">
              By submitting, you consent to Mirror Progress storing your inquiry
              and contacting you about it. Read our{' '}
              <button
                type="button"
                className="theme-link"
                onClick={() => setShowPolicy(true)}
              >
                privacy policy
              </button>
              .
            </p>
          </div>
        </form>
      </div>

      {showPolicy ? (
        <div className="fixed inset-0 z-50 flex justify-center bg-black/35 px-[20px] backdrop-blur-lg">
          <div className="my-[50px] w-full max-w-[640px] overflow-y-auto rounded-[32px] theme-panel px-[24px] py-[28px]">
            <div className="flex items-start justify-between gap-[18px]">
              <div>
                <h2 className="font-dmSans text-[42px] font-light leading-100 tracking-m3p">
                  Privacy Policy
                </h2>
                <p className="theme-page-subtle mt-[10px] font-diatype text-[12px] uppercase tracking-m3p">
                  Effective Date: January 1st 2025
                </p>
              </div>
              <button
                className="theme-secondary-button rounded-[24px] px-[18px] py-[9px] font-inter text-[13px]"
                onClick={() => setShowPolicy(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-[28px] grid gap-[22px]">
              {policyText.map((section) => (
                <div key={section.id} className="font-dmSans text-[15px] leading-130">
                  <h3 className="text-[color:var(--theme-page-text)]">{section.title}</h3>
                  <p className="theme-page-muted mt-[8px]">{section.text}</p>
                  {section.items.length ? (
                    <ul className="theme-page-muted mt-[8px] list-disc pl-[22px]">
                      {section.items.map((item) => (
                        <li key={item.id}>{item.text}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Form;
