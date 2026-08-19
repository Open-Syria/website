import { cacheLife, cacheTag } from "next/cache"

import type { Locale } from "@/i18n/routing"
import { getLocalePath, siteConfig, siteLinks } from "@/lib/site"

type LocalizedText = Record<Locale, string>

type LocalizedList = Record<Locale, readonly string[]>

type DatasetDetails = {
  coverage: LocalizedText
  intendedUses: LocalizedList
  limitations: LocalizedText
  provenance: LocalizedText
  releaseContext: LocalizedText
}

type DatasetRecordGroup = {
  count: number
  name: LocalizedText
}

type DatasetDistribution = {
  encodingFormat: string
  format: string
  name: string
  url: string
}

export type DatasetCatalogItem = {
  apiRoutes: readonly string[]
  category: string
  description: LocalizedText
  details: DatasetDetails | null
  distributions: readonly DatasetDistribution[]
  formats: readonly string[]
  id: string
  keywords: LocalizedList
  apiDocsUrl: string
  licenseUrl: string
  openApiUrl: string
  recordGroups: readonly DatasetRecordGroup[]
  releaseTag: string
  repositoryName: string
  repositoryUrl: string
  shortDescription: LocalizedText
  slug: string
  title: LocalizedText
  totalRecords: number
  updatedAt: string | null
}

export type DatasetSlug = string

type DatasetDescriptor = {
  apiRoutes?: readonly string[]
  description?: LocalizedText
  details?: DatasetDetails
  keywords?: LocalizedList
  recordGroupLabels?: Record<string, LocalizedText>
  recordGroupOrder?: readonly string[]
  repository?: string
  shortDescription?: LocalizedText
  slug: string
  title?: LocalizedText
  totalRecordArtifacts?: readonly string[]
}

type DatasetApiSummary = {
  apiEndpoints?: string[]
  category?: string
  description?: Partial<LocalizedText>
  id?: string
  name?: Partial<LocalizedText>
  repository?: string
  slug?: string
  status?: string
  updatedAt?: string | null
  version?: string | null
}

type DatasetApiResponse = {
  data?: {
    items?: DatasetApiSummary[]
  }
}

type GitHubReleaseAsset = {
  browser_download_url?: string
  name?: string
}

type GitHubRelease = {
  assets?: GitHubReleaseAsset[]
  published_at?: string | null
  tag_name?: string
}

type DatasetReleaseArtifact = {
  format?: string
  mediaType?: string
  name?: string
  path?: string
  recordCount?: number
  sizeBytes?: number
  url?: string
}

type DatasetReleaseManifest = {
  artifacts?: DatasetReleaseArtifact[]
  dataset?: {
    category?: string
    id?: string
    repository?: string
    slug?: string
    title?: Partial<LocalizedText>
  }
  generatedAt?: string
  release?: {
    publishedAt?: string | null
    status?: string
    version?: string
  }
}

type ReleaseData = {
  manifest: DatasetReleaseManifest | null
  manifestUrl: string | null
  release: GitHubRelease | null
}

const GITHUB_API_BASE = "https://api.github.com"
const RELEASE_MANIFEST_FILE = "release-manifest.json"
const emptyLocalizedList: LocalizedList = { ar: [], en: [] }

const datasetApiRoutes = {
  geography: [
    "/api/v1/geography/governorates",
    "/api/v1/geography/governorates/{governorateId}",
    "/api/v1/geography/districts",
    "/api/v1/geography/districts/{districtId}",
    "/api/v1/geography/subdistricts",
    "/api/v1/geography/subdistricts/{subdistrictId}",
    "/api/v1/geography/localities",
    "/api/v1/geography/localities/{localityId}",
  ],
  telecom: [
    "/api/v1/telecom/country-numbering-plans",
    "/api/v1/telecom/country-numbering-plans/{countryNumberingPlanId}",
    "/api/v1/telecom/operators",
    "/api/v1/telecom/operators/{operatorId}",
    "/api/v1/telecom/fixed-area-codes",
    "/api/v1/telecom/fixed-area-codes/{fixedAreaCodeId}",
    "/api/v1/telecom/mobile-prefixes",
    "/api/v1/telecom/mobile-prefixes/{mobilePrefixId}",
    "/api/v1/telecom/number-ranges",
    "/api/v1/telecom/number-ranges/{numberRangeId}",
  ],
  transport: [
    "/api/v1/transport/locations",
    "/api/v1/transport/locations/{locationId}",
    "/api/v1/transport/status-snapshots",
    "/api/v1/transport/status-snapshots/{statusSnapshotId}",
    "/api/v1/transport/route-snapshots",
    "/api/v1/transport/route-snapshots/{routeSnapshotId}",
  ],
  universities: ["/api/v1/universities", "/api/v1/universities/{universityId}"],
} as const

const datasetDescriptors = [
  {
    description: {
      ar: "حمّل بيانات المدن والمحافظات والمناطق والنواحي والبلدات والقرى والمحلات السورية مع الإحداثيات وملفات JSON وCSV للخرائط والبحث.",
      en: "Download Syrian cities, governorates, districts, subdistricts, towns, villages, localities, coordinates, and JSON/CSV files for maps and research.",
    },
    details: {
      coverage: {
        ar: "تغطي البيانات المرجعية الإدارية المحافظات والمناطق والنواحي والمحلات، بما فيها المدن والبلدات والقرى وغيرها من التجمعات السكانية. وقد يتضمن السجل أسماء عربية وإنجليزية، وروابط التسلسل الإداري، والمراكز الجغرافية، والمساحة، وقياسات سكانية مؤرخة، ومعرفات عامة عندما يدعمها مصدر قابل لإعادة الاستخدام.",
        en: "Administrative reference data spans governorates, districts, subdistricts, and localities, including cities, towns, villages, and other populated places. Records may include Arabic and English names, hierarchy links, centroids, area, dated population measurements, and public identifiers when a reusable source supports them.",
      },
      intendedUses: {
        ar: [
          "توحيد أسماء الأماكن السورية والعلاقات بين مستوياتها الإدارية.",
          "ربط مجموعات البيانات العامة باستخدام معرفات OpenSyria أو P-code أو GeoNames أو Wikidata أو geoBoundaries عند توفرها.",
          "إنشاء خرائط بحثية وأدلة وأدوات بحث وتحليلات صحفية اعتمادًا على بيانات مرجعية قابلة للتنزيل.",
        ],
        en: [
          "Normalize Syrian place names and administrative relationships.",
          "Join public datasets through stable OpenSyria, P-code, GeoNames, Wikidata, or geoBoundaries identifiers when present.",
          "Build research maps, search tools, directories, and journalistic analyses from downloadable reference data.",
        ],
      },
      limitations: {
        ar: "هذه بيانات مرجعية، وليست خريطة مباشرة أو ضمانًا للاكتمال. قد تغيب بعض الأسماء البديلة أو الإحداثيات أو المساحة أو السكان أو المعرفات الخارجية. القيم السكانية قياسات تاريخية يجب قراءتها مع سنة المصدر، ولا تتضمن سجلات المحلات حاليًا بيانات سكانية.",
        en: "This is reference data, not a live map or a guarantee of completeness. Optional names, aliases, coordinates, area, population, and external IDs can be missing. Subnational population values are historical measurements that must be read with their source year, and locality records do not currently include population.",
      },
      provenance: {
        ar: "تُجمع السجلات من مصادر عامة معتمدة، منها HDX/OCHA وgeoBoundaries وGeoNames وWikidata وجداول مكتب الإحصاء الأميركي المنشورة عبر HDX. يربط كل سجل معرفات المصادر بمراجع مؤرخة، وتتحقق الاختبارات الآلية من التسلسل الإداري ونسب المصادر.",
        en: "Records are compiled from approved public sources including HDX/OCHA, geoBoundaries, GeoNames, Wikidata, and U.S. Census Bureau tables distributed through HDX. Each record connects source IDs to dated source references, while automated validation checks hierarchy and attribution.",
      },
      releaseContext: {
        ar: "تُتحقق البيانات الأساسية بصيغة JSON آليًا، ثم تُحول إلى إصدارات مرقمة بصيغ JSON وNDJSON وCSV وSQL وYAML وXML. ملفات الإصدار المنشور ثابتة، وتصدر التصحيحات في نسخة جديدة. تحتفظ قيم السكان بسنة مصدرها حتى لا تُعرض القياسات التاريخية بوصفها تقديرات حالية.",
        en: "Canonical JSON is validated and converted into versioned JSON, NDJSON, CSV, SQL, YAML, and XML artifacts. Published release assets are immutable; fixes are issued in a new tagged release. Population values retain their source year so historical measurements are not presented as current estimates.",
      },
    },
    keywords: {
      ar: [
        "بيانات المدن السورية",
        "بيانات المحافظات السورية",
        "محافظات سوريا",
        "مناطق سوريا",
        "نواحي سوريا",
      ],
      en: [
        "Syrian cities dataset",
        "Syrian cities CSV",
        "Syrian cities JSON",
        "Syria governorates",
        "Syria governorates dataset",
        "Syria districts",
        "Syria districts data",
        "Syria subdistricts",
        "Syria localities",
        "Syrian towns and villages",
        "Syrian administrative divisions",
        "Syria places CSV",
        "Syria maps data",
      ],
    },
    recordGroupLabels: {
      districts: { ar: "منطقة", en: "Districts" },
      governorates: { ar: "محافظة", en: "Governorates" },
      localities: {
        ar: "مدينة وبلدة وقرية ومحلة",
        en: "Localities",
      },
      subdistricts: { ar: "ناحية", en: "Subdistricts" },
    },
    recordGroupOrder: [
      "governorates",
      "districts",
      "subdistricts",
      "localities",
    ],
    apiRoutes: datasetApiRoutes.geography,
    repository: "data-geography",
    shortDescription: {
      ar: "محافظات ومناطق ونواح ومدن وبلدات وقرى ومحلات سورية.",
      en: "Governorates, districts, subdistricts, cities, towns, villages, and localities in Syria.",
    },
    slug: "geography",
    title: {
      ar: "بيانات المدن والمحافظات والمحلات السورية",
      en: "Syrian Cities, Governorates and Localities Data",
    },
    totalRecordArtifacts: [
      "governorates",
      "districts",
      "subdistricts",
      "localities",
    ],
  },
  {
    description: {
      ar: "حمّل بيانات الجامعات السورية: الجامعات العامة والخاصة، المعاهد العليا، المواقع الرسمية، المحافظات، التصنيفات، وملفات JSON وCSV.",
      en: "Download Syrian university and higher education data with public and private universities, locations, official websites, rankings, and JSON/CSV files.",
    },
    details: {
      coverage: {
        ar: "تشمل الملفات التعريفية الجامعات العامة والخاصة والافتراضية والمؤسسات التقنية والمعاهد العليا الواقعة ضمن نطاق الإنتاج المعتمد. وبحسب توفر المصادر، قد يتضمن الملف أسماء باللغتين، ونوع المؤسسة، وسنة التأسيس، والموقع الرسمي، والمكان العام، ومعرفات خارجية، وشعارًا معتمدًا، ولقطات تصنيف مؤرخة.",
        en: "Profiles cover public, private, virtual, and technical or higher institutions within the approved production scope. Depending on available sources, a profile may include bilingual names, type, founding year, official website, public location, external IDs, an approved logo asset, and dated ranking snapshots.",
      },
      intendedUses: {
        ar: [
          "إنشاء أدلة موحدة للجامعات والمعاهد السورية بأسمائها ومعرفاتها العامة.",
          "دراسة التوزع الجغرافي وأنواع المؤسسات بالاعتماد على الحقائق العامة المتاحة.",
          "استخدام لقطات التصنيف المؤرخة في البحث مع الاحتفاظ باسم المزود وسنة اللقطة.",
        ],
        en: [
          "Create normalized directories of Syrian universities and higher institutes with public names and identifiers.",
          "Study the public geographic distribution and institution types represented in the approved scope.",
          "Use dated ranking snapshots in research while retaining the provider name and snapshot year.",
        ],
      },
      limitations: {
        ar: "تبقى حالة التشغيل غير مؤكدة في الملفات الحالية، وقد تغيب بعض المواقع الرسمية أو معرفات Wikidata أو الإحداثيات الموثقة. تغطية التصنيفات جزئية ومرتبطة بزمن ومزود محددين، ولا يجب اعتبارها تقييمًا شاملًا أو آنيًا للجودة. لا تتضمن البيانات سجلات للطلاب أو العاملين.",
        en: "Operating status remains unconfirmed in the current profiles, and some official websites, Wikidata IDs, or source-backed centroids are missing. Ranking coverage is partial and time-specific; it must not be treated as a complete or current quality assessment. The dataset contains no student or staff records.",
      },
      provenance: {
        ar: "يجب أن تكون المؤسسة ضمن النطاق المعتمد، وأن يؤكد هويتها مصدر عام معتمد. تستشهد السجلات بمصادر مثل المواقع الرسمية للمؤسسات، وWikidata، والأدلة المرجعية القابلة لإعادة الاستخدام، ومزودي التصنيفات المسمّين. ويقترن كل مصدر بمرجع مؤرخ على مستوى السجل.",
        en: "An institution must fall within the approved scope and be confirmed by an approved public source. Records cite sources such as official institution pages, Wikidata, reusable reference lists, and named ranking providers; every source is paired with a dated record-level reference.",
      },
      releaseContext: {
        ar: "تُنشر هويات الجامعات وأصول الشعارات ولقطات التصنيف في ملفات منفصلة. وتبقى ملفات الكليات والبرامج فارغة عمدًا إلى أن تُراجع مصادر معتمدة قابلة لإعادة الاستخدام. ملفات النسخة المنشورة ثابتة، وتتطلب التصحيحات إصدار نسخة جديدة.",
        en: "University identities, logo assets, and ranking snapshots are released as separate artifacts. Faculty and program artifacts remain intentionally empty until approved reusable sources are reviewed. Published version assets are immutable, and corrections require a new release.",
      },
    },
    keywords: {
      ar: [
        "جامعات سوريا",
        "بيانات الجامعات السورية",
        "قائمة الجامعات السورية",
        "الجامعات الحكومية السورية",
        "الجامعات الخاصة السورية",
        "تصنيفات الجامعات السورية",
        "بيانات التعليم العالي السوري",
        "تحميل بيانات الجامعات السورية",
      ],
      en: [
        "Syrian universities dataset",
        "Syria universities",
        "Syrian universities list",
        "Syrian higher education data",
        "Syrian university rankings",
        "Syria public universities",
        "Syria private universities",
        "Syria universities CSV",
        "Syria universities JSON",
        "Damascus University data",
        "Syrian higher education dataset",
        "Syrian university data download",
      ],
    },
    recordGroupLabels: {
      assets: { ar: "أصل شعار معتمد", en: "Approved logo assets" },
      rankings: { ar: "لقطة تصنيف", en: "Ranking snapshots" },
      universities: {
        ar: "جامعة ومعهد عال",
        en: "University profiles",
      },
    },
    recordGroupOrder: ["universities", "assets", "rankings"],
    apiRoutes: datasetApiRoutes.universities,
    repository: "data-universities",
    shortDescription: {
      ar: "جامعات ومعاهد سورية مع أسماء ومواقع ومعرفات وأصول عامة.",
      en: "Syrian universities and higher institutes with names, locations, identifiers, and public assets.",
    },
    slug: "universities",
    title: {
      ar: "بيانات الجامعات السورية والتصنيفات والتنزيلات",
      en: "Syrian Universities Data, Rankings and Downloads",
    },
    totalRecordArtifacts: ["universities"],
  },
  {
    description: {
      ar: "حمّل بيانات مواقع النقل السورية: المطارات والموانئ والمعابر الحدودية ومحطات السكك والطرق، مع لقطات حالة مؤرخة وملفات JSON وCSV.",
      en: "Download source-backed Syrian transport data for airports, ports, border crossings, road and rail terminals, with dated status snapshots and JSON/CSV files.",
    },
    details: {
      coverage: {
        ar: "تغطي البيانات مواقع مرجعية عامة، منها المطارات المدنية، والموانئ، والمعابر الحدودية، ومحطات السكك الحديدية والطرق، مع إحداثيات ومعرفات عامة موثقة. وتُنشر ملاحظات الحالة والمسار على شكل لقطات تاريخية منفصلة عن هوية الموقع الثابتة.",
        en: "Coverage includes public civil airports, seaports, border crossings, rail and road terminals, and trade locations with source-backed coordinates and public identifiers. Status and route observations are published as dated historical snapshots separate from stable location identity.",
      },
      intendedUses: {
        ar: [
          "البحث عن مواقع النقل العامة ومطابقة معرفاتها بين المصادر.",
          "إنشاء خرائط وأدلة بحثية للمطارات والموانئ والمعابر والمحطات.",
          "دراسة لقطات الحالة والمسار ضمن تاريخها ومصدرها المحددين.",
        ],
        en: [
          "Look up public transport locations and match their identifiers across sources.",
          "Build research maps and directories of airports, ports, crossings, and terminals.",
          "Study status and route snapshots within their explicit date and source context.",
        ],
      },
      limitations: {
        ar: "لا توفر المجموعة مسارات أو جداول رحلات أو حالة تشغيل مباشرة. تبقى حالة التشغيل غير معروفة لمعظم المواقع، وقد تغيب بعض الأسماء العربية أو الروابط الإدارية أو المعرفات. لا تتضمن البيانات هندسة المسارات أو تفاصيل تكتيكية أو مواقع عسكرية أو نقاط تفتيش.",
        en: "This dataset does not provide live routing, schedules, access, or operating conditions. Status remains unknown for most locations, and some Arabic names, administrative links, or external IDs are missing. Route geometry, tactical details, military locations, and checkpoints are excluded.",
      },
      provenance: {
        ar: "تشمل المصادر العامة المراجعة OurAirports وUN/LOCODE وGeoNames وWikidata ومؤشر الموانئ العالمي وبيانات HIU/HDX العامة، مع روابط إدارية مراجعة من OpenSyria. وتستخدم مصادر Logistics Cluster فقط لإثبات اللقطات المؤرخة.",
        en: "Reviewed public sources include OurAirports, UN/LOCODE, GeoNames, Wikidata, the World Port Index, public HIU/HDX data, and reviewed OpenSyria administrative links. Logistics Cluster sources are used only as evidence for dated status and route snapshots.",
      },
      releaseContext: {
        ar: "تبقى هوية الموقع الثابتة منفصلة عن ملاحظات الحالة والمسار المؤرخة. يحمل كل سجل لقطة تاريخ الحالة ومرجع المصدر، وتبقى ملفات الإصدار المرقم ثابتة بعد نشرها.",
        en: "Stable location identity is kept separate from dated status and route observations. Every snapshot carries an as-of date and source reference, while published versioned release assets remain immutable after publication.",
      },
    },
    keywords: {
      ar: [
        "بيانات النقل السورية",
        "مطارات سوريا",
        "موانئ سوريا",
        "المعابر الحدودية في سوريا",
      ],
      en: [
        "Syrian transport dataset",
        "Syria transport data",
        "Syria airports dataset",
        "Syrian airports data",
        "Syria ports data",
        "Syria border crossings dataset",
        "Syria border crossings data",
        "Syria rail stations data",
        "Syria road terminals",
        "Syria transport CSV",
        "Syria transport JSON",
        "Syrian logistics data",
        "Damascus airport data",
        "Aleppo airport data",
      ],
    },
    recordGroupLabels: {
      locations: {
        ar: "موقع نقل",
        en: "Transport locations",
      },
      "route-snapshots": {
        ar: "لقطة مسار",
        en: "Route snapshots",
      },
      "status-snapshots": {
        ar: "لقطة حالة",
        en: "Status snapshots",
      },
    },
    recordGroupOrder: ["locations", "status-snapshots", "route-snapshots"],
    apiRoutes: datasetApiRoutes.transport,
    repository: "data-transport",
    shortDescription: {
      ar: "مواقع نقل عامة ولقطات حالة ومسارات مؤرخة وموثقة بالمصادر.",
      en: "Public transport locations with dated status and route snapshots, source-backed coordinates, and identifiers.",
    },
    slug: "transport",
    title: {
      ar: "بيانات مواقع النقل السورية واللقطات المؤرخة",
      en: "Syrian Transport Locations, Status and Route Data",
    },
    totalRecordArtifacts: ["locations", "status-snapshots", "route-snapshots"],
  },
  {
    description: {
      ar: "حمّل بيانات ترقيم الاتصالات السورية مع رمز الدولة، رموز المناطق الثابتة، بادئات الهاتف المحمول، المشغلين، ونطاقات الأرقام العامة مع نسب المصادر وملفات JSON وCSV.",
      en: "Download source-backed Syrian telecom numbering data with country code, fixed area codes, mobile prefixes, operators, ranges, and JSON/CSV files.",
    },
    details: {
      coverage: {
        ar: "تغطي المجموعة رمز الدولة +963، وجهات التشغيل والمرجع، ورموز المناطق الثابتة المرتبطة بالمحافظات، وبادئات الهاتف المحمول، ونطاقات الترقيم العامة. هي بيانات وصفية عامة للترقيم، وليست بيانات اشتراكات.",
        en: "Coverage includes Syria's +963 country code, public operator and reference entities, fixed area codes linked to governorates, assigned mobile prefixes, and public numbering ranges. It is numbering metadata, not subscriber data.",
      },
      intendedUses: {
        ar: [
          "التحقق من أنماط الأرقام السورية وتنسيقها باستخدام بيانات مرجعية عامة.",
          "البحث المرجعي عن رموز المناطق وبادئات الهاتف المحمول وجهات الترقيم.",
          "إنشاء أدلة مدنية وأدوات بحثية تحتفظ بنسب المصدر وتاريخه.",
        ],
        en: [
          "Validate and format Syrian number patterns with public reference metadata.",
          "Look up fixed area codes, mobile prefixes, and numbering entities.",
          "Build civic directories and research tools that preserve source attribution and dates.",
        ],
      },
      limitations: {
        ar: "هذه السجلات ليست سجلًا آنيًا للتخصيصات أو الشبكات. لا تتضمن أرقامًا شخصية أو سجلات مشتركين أو أبراجًا أو تغطية أو أعطالًا. التسميات العربية غير مكتملة، وتبقى بادئة النفاذ الدولي دون قيمة إلى أن يؤكدها مصدر صريح.",
        en: "These records are not a live assignment or network registry. They contain no personal numbers, subscriber records, towers, coverage, or outages. Arabic labels are incomplete, and the international access prefix remains unset until an explicit source confirms it.",
      },
      provenance: {
        ar: "يعتمد الإصدار على مواد خطة الترقيم العامة التي تستضيفها المنظمة الدولية للاتصالات وأعلنتها الهيئة السورية الناظمة للاتصالات والبريد. وتوفر بيانات الجغرافيا من OpenSyria معرفات المحافظات فقط. يحمل كل سجل معرفات مصادر ومراجع مؤرخة، مع إظهار قيود إعادة الاستخدام.",
        en: "The release is based on public ITU-hosted numbering-plan material announced by the Syrian telecommunications regulator. OpenSyria geography supplies governorate identifiers only. Every record carries source IDs and dated references, while source reuse limitations remain documented.",
      },
      releaseContext: {
        ar: "تُنشر حقائق الترقيم على شكل لقطات مرجعية مؤرخة، وليس كحقيقة تشغيلية مباشرة. تُولد ملفات JSON وNDJSON وCSV وSQL وYAML وXML من البيانات الأساسية، وتصدر التصحيحات في نسخة مرقمة جديدة.",
        en: "Numbering facts are published as dated reference snapshots, not live network truth. JSON, NDJSON, CSV, SQL, YAML, and XML artifacts are generated from canonical data, and corrections are issued in a new versioned release.",
      },
    },
    keywords: {
      ar: [
        "بيانات الاتصالات السورية",
        "رموز الهاتف في سوريا",
        "رمز سوريا الدولي 963",
        "بادئات الهاتف المحمول في سوريا",
      ],
      en: [
        "Syrian telecom dataset",
        "Syria phone numbering data",
        "Syria country code 963",
        "Syria area codes dataset",
        "Syrian fixed area codes",
        "Syria mobile prefixes",
        "Syriatel prefixes",
        "MTN Syria prefixes",
        "WAFA Telecom prefixes",
        "Syria telecom CSV",
        "Syria telecom JSON",
        "Syrian numbering plan",
      ],
    },
    recordGroupLabels: {
      "country-numbering-plans": {
        ar: "خطة ترقيم وطنية",
        en: "Country numbering plans",
      },
      "fixed-area-codes": {
        ar: "رمز منطقة ثابتة",
        en: "Fixed area codes",
      },
      "mobile-prefixes": {
        ar: "بادئة هاتف محمول",
        en: "Mobile prefixes",
      },
      "number-ranges": {
        ar: "نطاق ترقيم عام",
        en: "Number ranges",
      },
      operators: {
        ar: "مشغل أو جهة ترقيم",
        en: "Operators",
      },
    },
    recordGroupOrder: [
      "country-numbering-plans",
      "operators",
      "fixed-area-codes",
      "mobile-prefixes",
      "number-ranges",
    ],
    apiRoutes: datasetApiRoutes.telecom,
    repository: "data-telecom",
    shortDescription: {
      ar: "رموز اتصال وبادئات ومشغلون ونطاقات ترقيم سورية موثقة بالمصادر.",
      en: "Syrian dialing codes, prefixes, operators, and public numbering ranges with source attribution.",
    },
    slug: "telecom",
    title: {
      ar: "بيانات ترقيم الاتصالات السورية والتنزيلات",
      en: "Syrian Telecom Numbering Data and Downloads",
    },
    totalRecordArtifacts: [
      "country-numbering-plans",
      "operators",
      "fixed-area-codes",
      "mobile-prefixes",
      "number-ranges",
    ],
  },
] as const satisfies readonly DatasetDescriptor[]

const datasetDescriptorBySlug: ReadonlyMap<string, DatasetDescriptor> = new Map(
  datasetDescriptors.map((descriptor) => [descriptor.slug, descriptor])
)

const formatOrder = ["JSON", "NDJSON", "CSV", "SQL", "YAML", "XML"]

const mediaTypeByFormat: Record<string, string> = {
  CSV: "text/csv",
  JSON: "application/json",
  NDJSON: "application/x-ndjson",
  SQL: "application/sql",
  XML: "application/xml",
  YAML: "application/yaml",
}

export async function getDatasetCatalog(): Promise<DatasetCatalogItem[]> {
  "use cache"

  cacheLife("hours")
  cacheTag("dataset-catalog")

  const apiSummaries = await getDatasetApiSummaries()
  const publicSummaries = apiSummaries.filter(isPublicDatasetSummary)
  const sources = getDatasetCatalogSources(publicSummaries)

  const catalog = await Promise.all(
    sources.map(async (summary) => {
      const descriptor = getDatasetDescriptor(summary)
      const releaseData = await getDatasetReleaseData(summary, descriptor)

      return buildDatasetCatalogItem(summary, descriptor, releaseData)
    })
  )

  return catalog.sort((first, second) =>
    first.title.en.localeCompare(second.title.en)
  )
}

function getDatasetCatalogSources(publicSummaries: DatasetApiSummary[]) {
  const sources: DatasetApiSummary[] = [...publicSummaries]
  const publicKeys = new Set(
    publicSummaries.flatMap((summary) => [
      summary.repository ? `repository:${summary.repository}` : "",
      summary.slug ? `slug:${summary.slug}` : "",
    ])
  )

  for (const descriptor of datasetDescriptors) {
    const descriptorKeys = [
      descriptor.repository ? `repository:${descriptor.repository}` : "",
      `slug:${descriptor.slug}`,
    ]

    if (descriptorKeys.some((key) => publicKeys.has(key))) {
      continue
    }

    sources.push({
      repository: descriptor.repository,
      slug: descriptor.slug,
      status: "released",
    })
  }

  return sources
}

export async function getDatasetBySlug(slug: string) {
  const catalog = await getDatasetCatalog()

  return catalog.find((dataset) => dataset.slug === slug)
}

export async function getDatasetSlugs() {
  const catalog = await getDatasetCatalog()

  return catalog.map((dataset) => dataset.slug)
}

function buildDatasetCatalogItem(
  summary: DatasetApiSummary,
  descriptor: DatasetDescriptor | undefined,
  releaseData: ReleaseData
): DatasetCatalogItem {
  const manifest = releaseData.manifest
  const repositoryName =
    summary.repository ??
    manifest?.dataset?.repository ??
    descriptor?.repository ??
    ""
  const repositoryUrl = getRepositoryUrl(repositoryName)
  const slug =
    summary.slug ??
    manifest?.dataset?.slug ??
    descriptor?.slug ??
    repositoryName
  const apiDescription = getLocalizedText(summary.description)
  const apiTitle = getLocalizedText(summary.name)
  const manifestTitle = getLocalizedText(manifest?.dataset?.title)
  const artifacts = getReleaseArtifacts(manifest)
  const distributions = getDistributions({
    artifacts,
    manifestUrl: releaseData.manifestUrl,
    releaseTag:
      manifest?.release?.version ??
      releaseData.release?.tag_name ??
      summary.version ??
      null,
    repositoryName,
  })
  const recordGroups = getRecordGroups(artifacts, descriptor)

  return {
    apiRoutes:
      summary.apiEndpoints && summary.apiEndpoints.length > 0
        ? summary.apiEndpoints
        : (descriptor?.apiRoutes ?? []),
    category: summary.category ?? manifest?.dataset?.category ?? "dataset",
    description:
      descriptor?.description ??
      apiDescription ??
      getFallbackLocalizedText(titleFromSlug(slug)),
    details: descriptor?.details ?? null,
    distributions,
    formats: getFormats(artifacts),
    id: summary.id ?? manifest?.dataset?.id ?? `opensyria-${slug}`,
    keywords: descriptor?.keywords ?? emptyLocalizedList,
    apiDocsUrl: getDatasetApiDocsUrl(slug),
    licenseUrl: `${repositoryUrl}/blob/main/LICENSE.md`,
    openApiUrl: `${getDatasetsApiBase()}/openapi/${slug}.json`,
    recordGroups,
    releaseTag:
      releaseData.release?.tag_name ??
      manifest?.release?.version ??
      summary.version ??
      "Unknown",
    repositoryName,
    repositoryUrl,
    shortDescription:
      descriptor?.shortDescription ??
      apiDescription ??
      getFallbackLocalizedText(titleFromSlug(slug)),
    slug,
    title:
      descriptor?.title ??
      apiTitle ??
      manifestTitle ??
      getFallbackLocalizedText(titleFromSlug(slug)),
    totalRecords: getTotalRecords(artifacts, descriptor),
    updatedAt:
      manifest?.release?.publishedAt ??
      summary.updatedAt ??
      releaseData.release?.published_at ??
      manifest?.generatedAt ??
      null,
  }
}

async function getDatasetReleaseData(
  summary: DatasetApiSummary,
  descriptor: DatasetDescriptor | undefined
): Promise<ReleaseData> {
  const repositoryName =
    summary.repository ??
    descriptor?.repository ??
    summary.slug ??
    descriptor?.slug

  if (!repositoryName) {
    return { manifest: null, manifestUrl: null, release: null }
  }

  const release = await getLatestGitHubRelease(repositoryName)
  const releaseTag = release?.tag_name ?? summary.version ?? null

  if (!releaseTag) {
    return { manifest: null, manifestUrl: null, release }
  }

  const manifestUrl =
    getReleaseAssetUrl(release, RELEASE_MANIFEST_FILE) ??
    getReleaseDownloadUrl(repositoryName, releaseTag, RELEASE_MANIFEST_FILE)
  const manifest = await fetchJson<DatasetReleaseManifest>(manifestUrl, {
    Accept: "application/json",
    "User-Agent": "OpenSyria-Website",
  })

  return { manifest, manifestUrl, release }
}

async function getDatasetApiSummaries(): Promise<DatasetApiSummary[]> {
  const response = await fetchJson<DatasetApiResponse>(
    `${getDatasetsApiBase()}/api/v1/datasets`,
    {
      Accept: "application/json",
      "User-Agent": "OpenSyria-Website",
    }
  )

  return response?.data?.items?.filter(isDatasetApiSummary) ?? []
}

async function getLatestGitHubRelease(repositoryName: string) {
  return fetchJson<GitHubRelease>(
    `${GITHUB_API_BASE}/repos/${getGitHubOrganizationName()}/${encodeURIComponent(repositoryName)}/releases/latest`,
    githubHeaders()
  )
}

async function fetchJson<T>(
  url: string,
  headers: Record<string, string>
): Promise<T | null> {
  try {
    const response = await fetch(url, { headers })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as T
  } catch {
    return null
  }
}

function getDatasetDescriptor(summary: DatasetApiSummary) {
  if (summary.slug) {
    return datasetDescriptorBySlug.get(summary.slug)
  }

  return datasetDescriptors.find(
    (descriptor) => descriptor.repository === summary.repository
  )
}

function getReleaseArtifacts(manifest: DatasetReleaseManifest | null) {
  return (manifest?.artifacts ?? []).filter(isReleaseArtifact)
}

function getDistributions({
  artifacts,
  manifestUrl,
  releaseTag,
  repositoryName,
}: {
  artifacts: DatasetReleaseArtifact[]
  manifestUrl: string | null
  releaseTag: string | null
  repositoryName: string
}) {
  const distributions: DatasetDistribution[] = []

  if (manifestUrl) {
    distributions.push({
      encodingFormat: "application/json",
      format: "JSON",
      name: RELEASE_MANIFEST_FILE,
      url: manifestUrl,
    })
  }

  for (const artifact of artifacts) {
    const format = getFormatLabel(artifact.format)

    if (!format || (artifact.recordCount ?? 0) <= 0) {
      continue
    }

    const name = getArtifactFileName(artifact)
    const fallbackUrl =
      repositoryName && releaseTag
        ? getReleaseDownloadUrl(repositoryName, releaseTag, name)
        : null
    const url = artifact.url ?? fallbackUrl

    if (!url) {
      continue
    }

    distributions.push({
      encodingFormat: artifact.mediaType ?? mediaTypeByFormat[format] ?? format,
      format,
      name,
      url,
    })
  }

  return distributions
}

function getFormats(artifacts: DatasetReleaseArtifact[]) {
  const formats = new Set(
    artifacts
      .filter((artifact) => (artifact.recordCount ?? 0) > 0)
      .map((artifact) => getFormatLabel(artifact.format))
      .filter(isString)
  )

  return Array.from(formats).sort(
    (first, second) =>
      getFormatSortIndex(first) - getFormatSortIndex(second) ||
      first.localeCompare(second)
  )
}

function getRecordGroups(
  artifacts: DatasetReleaseArtifact[],
  descriptor: DatasetDescriptor | undefined
) {
  const jsonArtifactsByName = new Map(
    artifacts
      .filter(
        (artifact) =>
          artifact.name &&
          artifact.format?.toLowerCase() === "json" &&
          (artifact.recordCount ?? 0) > 0
      )
      .map((artifact) => [artifact.name as string, artifact])
  )
  const recordNames =
    descriptor?.recordGroupOrder ??
    Array.from(jsonArtifactsByName.keys()).sort((first, second) =>
      first.localeCompare(second)
    )

  return recordNames.flatMap((name) => {
    const artifact = jsonArtifactsByName.get(name)

    if (!artifact?.recordCount) {
      return []
    }

    return [
      {
        count: artifact.recordCount,
        name:
          descriptor?.recordGroupLabels?.[name] ??
          getFallbackLocalizedText(titleFromSlug(name)),
      },
    ]
  })
}

function getTotalRecords(
  artifacts: DatasetReleaseArtifact[],
  descriptor: DatasetDescriptor | undefined
) {
  const totalRecordArtifacts =
    descriptor?.totalRecordArtifacts ?? descriptor?.recordGroupOrder
  const jsonArtifacts = artifacts.filter(
    (artifact) =>
      artifact.name &&
      artifact.format?.toLowerCase() === "json" &&
      (artifact.recordCount ?? 0) > 0 &&
      (!totalRecordArtifacts ||
        totalRecordArtifacts.includes(artifact.name as string))
  )

  return jsonArtifacts.reduce(
    (total, artifact) => total + (artifact.recordCount ?? 0),
    0
  )
}

function getReleaseAssetUrl(release: GitHubRelease | null, assetName: string) {
  return release?.assets?.find((asset) => asset.name === assetName)
    ?.browser_download_url
}

function getReleaseDownloadUrl(
  repositoryName: string,
  releaseTag: string,
  fileName: string
) {
  return `${getRepositoryUrl(repositoryName)}/releases/download/${encodeURIComponent(releaseTag)}/${encodeURIComponent(fileName)}`
}

function getRepositoryUrl(repositoryName: string) {
  return `${siteLinks.githubOrganization}/${repositoryName}`
}

function getDatasetApiDocsUrl(slug: string) {
  return `${siteLinks.docs}#tag/${encodeURIComponent(slug)}`
}

function getArtifactFileName(artifact: DatasetReleaseArtifact) {
  const pathFileName = artifact.path?.split(/[\\/]/).at(-1)

  if (pathFileName) {
    return pathFileName
  }

  return `${artifact.name}.${artifact.format}`
}

function getFormatLabel(format: string | undefined) {
  return format?.trim().toUpperCase()
}

function getFormatSortIndex(format: string) {
  const index = formatOrder.indexOf(format)

  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

function getLocalizedText(value: Partial<LocalizedText> | undefined) {
  const en = value?.en
  const ar = value?.ar

  if (!(en || ar)) {
    return null
  }

  return {
    ar: ar ?? en ?? "",
    en: en ?? ar ?? "",
  }
}

function getFallbackLocalizedText(value: string): LocalizedText {
  return {
    ar: value,
    en: value,
  }
}

function titleFromSlug(value: string) {
  return value
    .replace(/^data[-_]/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getDatasetsApiBase() {
  return (
    process.env.NEXT_PUBLIC_DATASETS_API_URL?.replace(/\/+$/, "") ??
    siteLinks.datasetsApi
  )
}

function getGitHubOrganizationName() {
  return (
    siteLinks.githubOrganization.split("/").filter(Boolean).at(-1) ??
    "Open-Syria"
  )
}

function isPublicDatasetSummary(summary: DatasetApiSummary) {
  if (!summary.repository) {
    return false
  }

  return summary.status === "released"
}

function isDatasetApiSummary(value: DatasetApiSummary | undefined) {
  return Boolean(value?.slug && value.repository)
}

function isReleaseArtifact(
  artifact: DatasetReleaseArtifact
): artifact is Required<
  Pick<DatasetReleaseArtifact, "format" | "name" | "recordCount">
> &
  DatasetReleaseArtifact {
  return (
    typeof artifact.name === "string" &&
    typeof artifact.format === "string" &&
    typeof artifact.recordCount === "number"
  )
}

function isString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0
}

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "OpenSyria-Website",
    "X-GitHub-Api-Version": "2022-11-28",
  }
}

export function getLocalizedPath(locale: Locale, pathname = "") {
  const localePath = getLocalePath(locale)
  const normalizedPath = pathname.replace(/^\/+/, "").replace(/\/+$/, "")

  if (!normalizedPath) {
    return localePath
  }

  return localePath === "/"
    ? `/${normalizedPath}`
    : `${localePath}/${normalizedPath}`
}

export function getDatasetsPath(locale: Locale) {
  return getLocalizedPath(locale, "datasets")
}

export function getDatasetPath(locale: Locale, slug: DatasetSlug | string) {
  return getLocalizedPath(locale, `datasets/${slug}`)
}

export function getAbsoluteUrl(path: string) {
  return `${siteConfig.url}${path}`
}
