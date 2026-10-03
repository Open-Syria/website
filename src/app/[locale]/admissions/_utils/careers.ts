import type { FieldId, LocalizedText, Program } from "./types"

export type CareerOutlook = "promising" | "diverse" | "specialist"
const paths: Record<FieldId, LocalizedText> = {
  technology: {
    ar: "تطوير البرمجيات، الشبكات، البيانات والدعم التقني.",
    en: "Software, networks, data and technical support.",
  },
  engineering: {
    ar: "التصميم والتنفيذ، التشغيل والصيانة، بحسب الاختصاص.",
    en: "Design, construction, operations and maintenance, depending on the specialism.",
  },
  health: {
    ar: "الرعاية الصحية والمخابر والتأهيل، وفق الاختصاص والترخيص المهني.",
    en: "Care, laboratories and rehabilitation, subject to the qualification and professional licensing.",
  },
  business: {
    ar: "المحاسبة والإدارة والتمويل والتسويق، بحسب الاختصاص.",
    en: "Accounting, management, finance and marketing, depending on the specialism.",
  },
  agriculture: {
    ar: "الإنتاج الزراعي والغذائي، الجودة والخدمات الزراعية والبيطرية.",
    en: "Agriculture, food production, quality, agricultural and veterinary services.",
  },
  science: {
    ar: "المخابر وضبط الجودة والبحث والتعليم؛ بعض المسارات تحتاج تأهيلاً إضافياً.",
    en: "Laboratories, quality control, research and teaching; some paths need further qualifications.",
  },
  languages: {
    ar: "الترجمة والتعليم والمحتوى، مع تنمية المهارات اللغوية والرقمية.",
    en: "Translation, teaching and content, supported by strong language and digital skills.",
  },
  education: {
    ar: "التعليم والإرشاد والتدريب، بحسب الاختصاص وشروط مزاولة المهنة.",
    en: "Teaching, counselling and training, subject to the specialism and professional requirements.",
  },
  law: {
    ar: "العمل القانوني والإداري والبحث، وفق الاختصاص وشروط الترخيص.",
    en: "Legal practice, administration and research, subject to the specialism and licensing.",
  },
  arts: {
    ar: "التصميم والإنتاج الفني والعمل المستقل؛ ملف الأعمال مهم لبدء المسار.",
    en: "Design, creative production and freelance work; a portfolio helps establish a career.",
  },
  media: {
    ar: "الإنتاج الإعلامي والتحرير والمحتوى الرقمي، مع بناء ملف أعمال عملي.",
    en: "Media production, editing and digital content, supported by a practical portfolio.",
  },
  tourism: {
    ar: "الضيافة والخدمات السياحية وتنظيم الرحلات والفعاليات.",
    en: "Hospitality, tourism services, travel and events.",
  },
  humanities: {
    ar: "التعليم والبحث والعمل الثقافي، بحسب الاختصاص والتأهيل الإضافي.",
    en: "Teaching, research and cultural work, depending on the specialism and further training.",
  },
  religion: {
    ar: "التعليم والبحث والمؤسسات الدينية، بحسب الاختصاص وشروط الجهة المشغّلة.",
    en: "Teaching, research and religious institutions, depending on the specialism and employer requirements.",
  },
}

/** Editorial sector guidance, reviewed 2026-10-03. Never a graduate employment forecast.
 * Evidence and limits are visible in CareerGuide. No grade, gender or institution prestige is used.
 */
export function careerFor(program: Pick<Program, "field" | "name">) {
  const name = program.name.ar
  let outlook: CareerOutlook = "diverse"
  if (
    program.field === "agriculture" ||
    (program.field === "engineering" &&
      /مدني|إنشاء|انشاء|كهرب|متجدد|شمسية|تبريد|تدفئة|ميكانيك|صناع|صيانة|مائية/.test(
        name
      )) ||
    (program.field === "health" &&
      /الطب البشري|تمريض|قبالة|التحضيرية/.test(name))
  )
    outlook = "promising"
  else if (
    ["law", "humanities", "religion"].includes(program.field) ||
    /نووية|طيران|بحري/.test(name)
  )
    outlook = "specialist"
  return { outlook, paths: paths[program.field] }
}

export function careerPriority(program: Pick<Program, "field" | "name">) {
  return ({ promising: 0, diverse: 1, specialist: 2 } as const)[
    careerFor(program).outlook
  ]
}

export const careerSources = [
  {
    id: "industry",
    url: "https://www.ilo.org/publications/rapid-skills-gap-assessment-selected-industrial-sectors-syria",
  },
  {
    id: "agriculture",
    url: "https://www.ilo.org/publications/regional-value-chains-recovery-creating-jobs-and-shared-growth-syria",
  },
  {
    id: "reconstruction",
    url: "https://www.worldbank.org/en/news/press-release/2025/10/21/syria-s-post-conflict-reconstruction-costs-estimated-at-216-billion",
  },
  {
    id: "health",
    url: "https://healthcluster.who.int/countries-and-regions/syria-whole-of-syria",
  },
] as const
