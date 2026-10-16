export const alwaysOn = {
  title: "In the background",
  // needsRonnie: Intended background behavior; customer tool connections are not built.
  description:
    "Designed to follow project changes in the tools your teams already use.",
  exampleLabel: "Illustrative example.",
  // needsRonnie: The following UI and its review outcome illustrate intended behavior only.
  following: "Following · Example project",
  items: [
    "Meeting: facade review",
    "Sheet A-201 revised",
    "Spec 08 71 00 updated",
  ],
  counts: ["0", "1", "2", "3"],
  reviewNote: "Door 114A needs review",
  // needsRonnie: Accessible description of the same fictional sequence, not a capability claim.
  accessibleDescription:
    "A background indicator follows Example project. Three context items arrive: Meeting: facade review; Sheet A-201 revised; Spec 08 71 00 updated. The count rises from 0 to 3, then a note appears: Door 114A needs review.",
} as const;
