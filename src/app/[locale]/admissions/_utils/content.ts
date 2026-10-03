import type { SourceReference } from "./types"

type ContentSection = { id: string; sources: SourceReference[] }

export const guideSections: ContentSection[] = [
  {
    id: "compare",
    sources: [
      { announcement: 2, page: 18 },
      { announcement: 7, page: 2 },
    ],
  },
  {
    id: "score",
    sources: [
      { announcement: 1, page: 7 },
      { announcement: 1, page: 9 },
      { announcement: 4, page: 5 },
      { announcement: 4, page: 6 },
      { announcement: 1, page: 2 },
      { announcement: 7, page: 4 },
      { announcement: 3, page: 2 },
      { announcement: 6, page: 2 },
      { announcement: 8, page: 2 },
      { announcement: 9, page: 1 },
      { announcement: 10, page: 2 },
      { announcement: 11, page: 2 },
      { announcement: 9, page: 2 },
    ],
  },
  {
    id: "conditions",
    sources: [
      { announcement: 1, page: 5 },
      { announcement: 2, page: 18 },
      { announcement: 2, page: 19 },
    ],
  },
  {
    id: "choices",
    sources: [
      { announcement: 1, page: 2 },
      { announcement: 5, page: 12 },
      { announcement: 7, page: 1 },
    ],
  },
  {
    id: "directRegistration",
    sources: [
      { announcement: 8, page: 3 },
      { announcement: 9, page: 3 },
      { announcement: 3, page: 4 },
      { announcement: 6, page: 3 },
    ],
  },
]

export const faqItems: ContentSection[] = [
  {
    id: "minimum",
    sources: [
      { announcement: 2, page: 1 },
      { announcement: 7, page: 4 },
    ],
  },
  {
    id: "coverage",
    sources: [
      { announcement: 7, page: 4 },
      { announcement: 7, page: 6 },
      { announcement: 1, page: 7 },
      { announcement: 1, page: 9 },
      { announcement: 1, page: 11 },
      { announcement: 1, page: 12 },
      { announcement: 6, page: 4 },

      { announcement: 3, page: 1 },
      { announcement: 6, page: 1 },
      { announcement: 8, page: 1 },
      { announcement: 9, page: 1 },
      { announcement: 10, page: 2 },
      { announcement: 11, page: 2 },
    ],
  },
  {
    id: "score",
    sources: [
      { announcement: 1, page: 7 },
      { announcement: 1, page: 9 },
      { announcement: 1, page: 2 },

      { announcement: 4, page: 5 },
      { announcement: 4, page: 6 },
      { announcement: 3, page: 2 },
      { announcement: 6, page: 2 },
      { announcement: 7, page: 4 },
      { announcement: 8, page: 2 },
      { announcement: 9, page: 1 },
      { announcement: 10, page: 2 },
      { announcement: 11, page: 2 },
      { announcement: 9, page: 2 },
    ],
  },
  {
    id: "channels",
    sources: [
      { announcement: 7, page: 4 },
      { announcement: 7, page: 6 },

      { announcement: 2, page: 21 },
      { announcement: 4, page: 8 },
      { announcement: 5, page: 12 },
      { announcement: 3, page: 1 },
      { announcement: 6, page: 2 },
      { announcement: 8, page: 1 },
      { announcement: 9, page: 1 },
      { announcement: 10, page: 2 },
      { announcement: 11, page: 2 },
    ],
  },
  {
    id: "conditions",
    sources: [
      { announcement: 4, page: 5 },
      { announcement: 1, page: 5 },
      { announcement: 1, page: 30 },

      { announcement: 2, page: 18 },
      { announcement: 2, page: 19 },
    ],
  },
  { id: "submission", sources: [] },
  {
    id: "announcement",
    sources: [1, 3, 6, 8, 9, 10, 11].map((announcement) => ({
      announcement,
      page: 1,
    })),
  },
  {
    id: "dates",
    sources: [
      { announcement: 1, page: 20 },
      { announcement: 7, page: 9 },
      { announcement: 3, page: 14 },
      { announcement: 6, page: 28 },
      { announcement: 9, page: 8 },
      { announcement: 10, page: 25 },
      { announcement: 11, page: 24 },
    ],
  },
  {
    id: "fees",
    sources: [
      { announcement: 1, page: 18 },
      { announcement: 9, page: 7 },
      { announcement: 11, page: 23 },
      { announcement: 1, page: 4 },
      { announcement: 7, page: 7 },
      { announcement: 7, page: 2 },
      { announcement: 3, page: 12 },
      { announcement: 6, page: 27 },
      { announcement: 9, page: 4 },
      { announcement: 10, page: 22 },
      { announcement: 11, page: 21 },
    ],
  },
  {
    id: "applicationDocuments",
    sources: [17, 18].map((page) => ({ announcement: 1, page })),
  },
  {
    id: "edit",
    sources: [
      { announcement: 1, page: 17 },
      { announcement: 1, page: 4 },
      { announcement: 7, page: 7 },
      { announcement: 7, page: 8 },
      { announcement: 3, page: 12 },
      { announcement: 6, page: 27 },
      { announcement: 9, page: 4 },
      { announcement: 10, page: 22 },
      { announcement: 11, page: 21 },
    ],
  },
  { id: "support", sources: [{ announcement: 1, page: 20 }] },
  {
    id: "previousAdmission",
    sources: [
      { announcement: 1, page: 5 },
      { announcement: 3, page: 4 },
    ],
  },
  { id: "architecture", sources: [{ announcement: 1, page: 21 }] },
  {
    id: "entranceTests",
    sources: [22, 23, 24, 25, 26, 27, 28, 29].map((page) => ({
      announcement: 1,
      page,
    })),
  },
  {
    id: "privatePerformingArts",
    sources: [64, 65].map((page) => ({ announcement: 7, page })),
  },
  { id: "afterAdmission", sources: [{ announcement: 1, page: 30 }] },
  {
    id: "specialisations",
    sources: [3, 5, 12].map((page) => ({ announcement: 5, page })),
  },
  {
    id: "tieBreak",
    sources: [
      { announcement: 1, page: 19 },
      { announcement: 7, page: 3 },
      { announcement: 8, page: 2 },
      { announcement: 9, page: 1 },
      { announcement: 10, page: 2 },
      { announcement: 11, page: 2 },
      { announcement: 9, page: 2 },
    ],
  },
  {
    id: "vocational",
    sources: [
      { announcement: 6, page: 2 },
      { announcement: 6, page: 5 },
      { announcement: 7, page: 41 },
    ],
  },
  {
    id: "nonSyrian",
    sources: [
      { announcement: 8, page: 1 },
      { announcement: 8, page: 2 },
      { announcement: 9, page: 1 },
      { announcement: 10, page: 2 },
      { announcement: 11, page: 2 },
      { announcement: 9, page: 2 },
      { announcement: 8, page: 13 },
    ],
  },
  {
    id: "nonSyrianVocational",
    sources: [
      { announcement: 10, page: 6 },
      { announcement: 10, page: 1 },
      { announcement: 10, page: 2 },
      { announcement: 11, page: 2 },
      { announcement: 10, page: 21 },
      { announcement: 7, page: 6 },
    ],
  },
  {
    id: "foreignApplicants",
    sources: [
      { announcement: 7, page: 4 },
      { announcement: 7, page: 6 },

      ...[1, 2, 3, 4].map((page) => ({ announcement: 9, page })),
      ...[1, 2, 3].map((page) => ({ announcement: 11, page })),
    ],
  },
  {
    id: "foreignVocational",
    sources: [
      { announcement: 11, page: 1 },
      { announcement: 11, page: 2 },
      { announcement: 11, page: 3 },
      { announcement: 11, page: 15 },
      { announcement: 7, page: 7 },
    ],
  },
  {
    id: "sharia",
    sources: [
      { announcement: 1, page: 7 },
      { announcement: 3, page: 1 },
      { announcement: 3, page: 2 },
      { announcement: 3, page: 4 },
      { announcement: 4, page: 5 },
      { announcement: 4, page: 6 },
      { announcement: 7, page: 4 },
    ],
  },
  {
    id: "olderPrivate",
    sources: [
      ...[1, 2, 4, 5, 6, 7].map((page) => ({ announcement: 7, page })),
      { announcement: 1, page: 7 },
    ],
  },
  {
    id: "facultyFamily",
    sources: [
      { announcement: 1, page: 11 },
      { announcement: 3, page: 8 },
      { announcement: 6, page: 4 },
    ],
  },
  {
    id: "disability",
    sources: [
      { announcement: 1, page: 12 },
      { announcement: 1, page: 13 },
      { announcement: 1, page: 14 },
      { announcement: 1, page: 15 },
      { announcement: 1, page: 16 },
      { announcement: 3, page: 9 },
      { announcement: 3, page: 10 },
      { announcement: 3, page: 11 },
    ],
  },
  {
    id: "serviceAdmission",
    sources: [
      { announcement: 1, page: 7 },
      { announcement: 1, page: 8 },
      { announcement: 1, page: 9 },
      { announcement: 1, page: 10 },
      { announcement: 2, page: 21 },
      { announcement: 3, page: 6 },
      { announcement: 3, page: 7 },
      { announcement: 4, page: 8 },
      { announcement: 8, page: 4 },
      { announcement: 8, page: 5 },
      { announcement: 8, page: 6 },
      { announcement: 8, page: 7 },
      { announcement: 6, page: 11 },
      { announcement: 10, page: 6 },
    ],
  },
  {
    id: "directLanguageSyrian",
    sources: [
      { announcement: 8, page: 1 },
      { announcement: 8, page: 3 },
    ],
  },
  {
    id: "directLanguageForeign",
    sources: [
      { announcement: 9, page: 1 },
      { announcement: 9, page: 3 },
    ],
  },
  {
    id: "directSharia",
    sources: [
      { announcement: 3, page: 4 },
      { announcement: 4, page: 7 },
    ],
  },
  { id: "separateVocational", sources: [{ announcement: 6, page: 3 }] },
  { id: "educationInstitutes", sources: [{ announcement: 1, page: 30 }] },
]

export const sourceGroups = [
  { id: "scientific", announcements: [1, 2, 5, 7] },
  { id: "otherBranches", announcements: [3, 4, 6] },
  { id: "otherApplicants", announcements: [8, 9, 10, 11] },
] as const
