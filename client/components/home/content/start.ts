export const start = {
  title: "Start a conversation",
  steps: [
    // needsRonnie: Approve the starting scope and requested documents.
    {
      number: 1,
      text: "Tell us about a project you are working on.",
    },
    // needsRonnie: Approve the process wording about following the team's work.
    {
      number: 2,
      text: "We show you what Mirror Progress would follow.",
    },
    // needsRonnie: Approve the review process and decision about what continues.
    {
      number: 3,
      text: "Decide together what comes next.",
    },
  ],
  cta: {
    label: "Discuss a project",
    href: "/#contact",
  },
} as const;
