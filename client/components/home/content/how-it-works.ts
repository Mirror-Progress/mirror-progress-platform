export const howItWorks = {
  title: "How it works",
  items: [
    {
      id: "background",
      // needsRonnie: Background monitoring and coverage across teams need confirmation.
      title: "Runs in the background",
      description:
        "Follows the project as it develops, across every team involved.",
    },
    {
      id: "existing-tools",
      // needsRonnie: Proposed workflow; customer tool connections are not built yet.
      title: "In the tools your teams already use",
      description:
        "Work stays where it is. Nothing new to learn.",
    },
    {
      id: "decisions",
      // needsRonnie: Source comparison, decision routing and dependency review need confirmation.
      title: "Brings context to decisions",
      description:
        "Puts the right context in front of the people who decide, when it matters.",
    },
  ],
} as const;
