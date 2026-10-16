// Copy for the one-page homepage. Product claims need Ronnie's approval before launch.
export const site = {
  name: "Mirror Progress",
  homeLabel: "Mirror Progress home",
};

export const hero = {
  // needsRonnie: headline chosen by Jahlon, Oct 15 2026.
  title: "Projects that stay consistent from planning through construction.",
  primary: { href: "/#contact", label: "Discuss a project" },
};

export const contactEmail = "hello@mirrorprogress.com";

export const contact = {
  title: "Discuss a project",
  fields: [
    { id: "name", label: "Name", type: "text", autoComplete: "name" },
    { id: "email", label: "Work email", type: "email", autoComplete: "email" },
    { id: "org", label: "Organization", type: "text", autoComplete: "organization" },
  ],
  noteLabel: "Project details",
  submit: "Send",
  sending: "Sending",
  sent: "Thanks. We will be in touch.",
  failed: "That did not send. Email us at",
};

// Affiliation logos: official files (Anthropic press kit; uclaunch.com). Included at Jahlon's direction, Oct 15 2026.
// Anthropic's trademark guidelines ask for written permission before startups use the Claude logo; confirm before launch.
export const affiliations = {
  label: "Affiliations",
  items: [
    { name: "Claude Startups", prefix: "Member of", href: "https://claude.com/programs/startups", suffix: "Startups", logo: { src: "/home/claude-logo-slate.svg", alt: "Claude", width: 9156, height: 2000, className: "h-5" } },
    { name: "UC LAUNCH", prefix: "Part of", href: "https://www.uclaunch.com/", suffix: "", logo: { src: "/home/uc-launch-logo.png", alt: "UC LAUNCH Accelerator", width: 600, height: 328, className: "h-12" } },
  ],
};
