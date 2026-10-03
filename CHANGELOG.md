# Changelog

## Unreleased

- Add optional protected exam-marks import for the admissions advisor, preserving exact subject scores and manual editing.
- Align admissions source links, add the Jobara footer partnership, and provide localized admissions sharing covers.
- Patch Next.js and transitive dependencies and retain licensed UI styles without the component CLI build dependency.

### Features

* explain direct language registration in Arabic and English with applicant-specific certificate years, branches, study-language conditions, fees and English/French tests; distinguish direct Sharia/Arabic institute registration from separate vocational ministry competitions

* support the Syrian 2026 vocational faculty-family quota with 291 source-mapped choices, engineering/other-college/institute thresholds, exact qualifications and preserved assessments; keep personnel eligibility and vacant scientific-quota places pending official confirmation

* support 31 defence/security choices across four deferred branch catalogues, with programme-specific certificate years, official percentage input, exact maritime qualifications, gender/security birth-year checks and pending official eligibility requirements

* support faculty-family and disability quotas for Syrian 2026 scientific, literary and Sharia certificates in three deferred catalogues with 1,031 route-specific choices; use quota-specific thresholds and retain official personnel/medical eligibility as pending confirmation

* support older-certificate private admission for both certificate origins: 2025 and earlier for Syrian/equivalent applicants and 2024 and earlier for Arab/foreign applicants, across scientific/literary/vocational branches; preserve official percentages, specialty matching, entrance tests and year-aware result restoration

* support Syrian 2026 Sharia certificates with 373 choices, a separate optional score for 19 dedicated faculty choices, pending results when that score is unknown, and direct-registration guidance for Sharia/Arabic institutes

* add a localized admissions advisor with 10,494 choices across twenty-four certificate/applicant catalogues, with per-track eligibility and a source-linked guide and FAQ
* support announcement 10 for 2026 non-Syrian vocational equivalents: 241 public parallel and 536 private choices, exact qualification matching, audited Arabic cell corrections, merged-grid deduplication and preserved entrance/railway conditions
* support announcement 11 for Arab/foreign vocational applicants with Syrian or equivalent non-Syrian certificates from 2025 or 2026: 241 public and 536 private choices, exact qualifications, age/assessment rules and source references; merge one missed duplicate welding row in announcement 10
* support announcement 9 for Arab/foreign scientific and literary applicants with Syrian or equivalent non-Syrian certificates from 2025 or 2026: 1,007 and 348 choices, a separate public track, explicit certificate year and category guidance, source-linked age/exam rules and route-aware storage/filtering
* support announcement 8 for 2026 non-Syrian scientific and literary certificates held by Syrian/equivalent applicants: 1,007 and 348 parallel/private choices using the official percentage, with separate deferred catalogues and certificate-specific form fields
* support literary totals out of 2200 and exact vocational certificate specialties, keeping branch catalogues in separate deferred assets
* defer the versioned admissions catalogue until calculation, paginate institution groups and choices, and add positive career guidance with its sources and limitations
* prioritize matching admissions options, faculties and general/parallel/private tracks; retain favourites locally, restore answers within the tab and preserve filters with short nuqs URL keys
* catalog all eleven Ministry admissions announcements and the support-centre directory; add applicant-category and previous general-admission checks
* use shadcn Select controls, revise Arabic admissions copy, and add permanent footer access plus a seasonal homepage section
* cache fixed admissions data with Cache Components and add localized admissions SEO, complete social metadata, breadcrumbs, and FAQ structured data
* add the transport dataset to the catalog, SEO metadata, and agent discovery surfaces
* include API-backed seed datasets in public dataset catalog routing

### Bug Fixes

* clarify pending eligibility and shared answers, align Arabic/English admission guidance, put common FAQ questions first, and correct source links and release-history placement

* consolidate repeated eligibility inputs into one compact shared dialog opened from the applicable admission-track container, save answers globally through the URL, and restore reading position and focus after results regroup, including pagination and filtered-out choices

* improve admissions readability in both languages with topic-based paragraph breaks and fewer repeated instructions, while retaining all scoring, eligibility and official-source guidance

* simplify mobile admissions results with closed groups, sticky institution headings, a scrollable filter dialog, and compact eligibility questions with primary-color selections, URL-synced answers and Undo; use 75 as the percentage example
* show questions only inside applicable admission tracks; evaluate reserved local/eastern quotas using the certificate-issuing governorate and remove unsupported origin checks from ordinary province rows
* expose saved choices above the results with a count and a mobile shortcut outside the filters dialog

* share one FAQ accordion across the homepage and admissions in both languages, with consistent styling, only the first question initially open, and every answer retained in the initial HTML

* complete the final 24-page admissions source review (309/309 pages); repair 16 displayed names while preserving choice/exam IDs and eligibility rules, and clarify application documents, test registration, post-admission checks, cancellation and separate Education Ministry procedures in both languages

* keep filtered and other parameterized page URLs out of search indexing with response-specific noindex headers, preserve clean canonicals and usable filters, and verify sitemap pages, language alternatives, metadata, structured data and social assets in the readiness checks

* verify initial admissions JavaScript assets in both locales and document stopping production previews before rebuilding, preventing stale local previews from leaving the calculator on its loading message

* correct literary/vocational Arabic course and campus names, institute grouping, and specialization filters without changing source thresholds or eligibility
* match Arabic admissions searches across the ل + ال contraction, so الترجمة also finds للترجمة
* preserve card rings inside admissions accordions and correct computing-institute mathematics to 60% for both public tracks
* apply IBM Plex Sans Arabic consistently to Arabic text, headings, and form controls instead of falling back through Latin font utilities
* align production rollout probes and registry authentication with the hardened Docker gateway
* prevent duplicated discovery response headers from taking the homepage offline
* include transport and telecom in the well-known API catalog from the shared discovery list
* honor `[skip ci]` consistently in the website CI workflow
* update Next.js and the dependency graph to patched releases and enforce a full audit in verification

## [0.5.3](https://github.com/Open-Syria/website/compare/v0.5.2...v0.5.3) (2026-08-22)


### Bug Fixes

* **404:** hide agent markdown from browser pages ([9206c8d](https://github.com/Open-Syria/website/commit/12728838c0c6c8bf3ec8d9f6bf60ab3be38b7156))

## [0.5.2](https://github.com/Open-Syria/website/compare/v0.5.1...v0.5.2) (2026-08-22)


### Bug Fixes

* **agent:** improve crawler and discovery readiness ([5dbd025](https://github.com/Open-Syria/website/commit/ecc8c8109fe73c343e2364fbd313fdf9a084567b))

## [0.5.1](https://github.com/Open-Syria/website/compare/v0.5.0...v0.5.1) (2026-08-19)


### Bug Fixes

* preserve GitHub metadata fallback during builds ([2eef306](https://github.com/Open-Syria/website/commit/e605d85f69afd4c5179c8bed0d2586adaab0589b))
* preserve GitHub metadata fallback during builds ([c14a89f](https://github.com/Open-Syria/website/commit/9c16b785fa74e8fa6fb0aa952c2c0456d09b0503))
* prevent dataset card action overflow ([e112ffd](https://github.com/Open-Syria/website/commit/2ae74101b23da0a1f585beeee019b8a457b0b57a))
* prevent dataset card action overflow ([fcd7014](https://github.com/Open-Syria/website/commit/ff90edbd882af66b7e5640f2130ff9767c2bc514))

## [0.5.0](https://github.com/Open-Syria/website/compare/v0.4.1...v0.5.0) (2026-08-19)


### Features

* add telecom dataset to website ([18632c9](https://github.com/Open-Syria/website/commit/ad79d6a1bca06d90954c0f903b81f5000b033356))
* **deploy:** harden OpenSyria production website ([d13b47e](https://github.com/Open-Syria/website/commit/8f8b7b8755c6e1ac4ede26c2decef909ee8657d9))
* **deploy:** harden OpenSyria production website ([#34](https://github.com/Open-Syria/website/issues/34)) ([adeddc1](https://github.com/Open-Syria/website/commit/af4090e97e2b7c8dd979e7107d69b8db90768ed8))
* improve search visibility and developer discovery ([ffdc2f2](https://github.com/Open-Syria/website/commit/ccda3359dcf2229b2b8ed1f0d3987cdc7b2b5444))
* improve search visibility and developer discovery ([05cb313](https://github.com/Open-Syria/website/commit/cdaaaa7fb386be44b5a1e35510b2093eb3693d47))


### Bug Fixes

* align dataset discovery and dependencies ([47c72e2](https://github.com/Open-Syria/website/commit/39750228d2139dc921a1289e2dfadb91634e0b02))
* cache GitHub metadata requests ([1c76148](https://github.com/Open-Syria/website/commit/3f58d9f55010f5fc1cc23cc60e5b66b4b5a32193))
* **ci:** allow automatic production deploy job ([4fed41e](https://github.com/Open-Syria/website/commit/f98867b7a79a13369506ee66befafe1cae3a3844))
* **ci:** run automatic production deploy after image build ([442a6c7](https://github.com/Open-Syria/website/commit/1587e693878db3636461701dc8e8708c3117fb83))
* **deploy:** align production rollout with gateway ([557840c](https://github.com/Open-Syria/website/commit/8236c39262cc866b36105c1a8c7ba388556edfb6))
* **deploy:** capture registry token before child tools ([c741f40](https://github.com/Open-Syria/website/commit/f7525140cf79574feab72f8a6195a1b59c6f7573))
* **deploy:** capture registry token before child tools ([1887ba3](https://github.com/Open-Syria/website/commit/a36cccca2c6adee9412450213cec36c03961684d))
* **deploy:** clean failed prepare rollback backup ([79bb522](https://github.com/Open-Syria/website/commit/ebaea64fd6511c220b71842b8feaa15b76e5a199))
* **deploy:** clean failed prepare rollback backup ([772492b](https://github.com/Open-Syria/website/commit/440f280a77f2019ba8236965a2257d036ec82e19))
* **deploy:** serialize and stabilize nginx cutovers ([4d7a0da](https://github.com/Open-Syria/website/commit/80efacc9b25489d87c489c69f078a58bdf8d1905))
* **deploy:** stabilize traffic cutovers ([4dd9f27](https://github.com/Open-Syria/website/commit/8c8361cd5386cdaf78b737bbb7b1306f6e6cc680))
* include local dataset descriptors in catalog ([bc342d3](https://github.com/Open-Syria/website/commit/3df6c621cfe0f45fbb27d1ada8c489ddd0d6c48c))
* keep dataset endpoint routes in fallback catalog ([2bd2850](https://github.com/Open-Syria/website/commit/07ce56bb04d1c060eab75ba954130f999b696889))
* move og logo metadata to layout ([2b698b6](https://github.com/Open-Syria/website/commit/bf91bda983aa944086f61659cd60b887d40f9d32))
* prevent oversized homepage response headers ([e77f641](https://github.com/Open-Syria/website/commit/e98d2335f078395f6b6028f2eda5f95dbb186200))
* prevent oversized homepage response headers ([056f260](https://github.com/Open-Syria/website/commit/2898dbe52ce0cd545bcc0abf0d4ae8e320e511ba))
* prevent oversized proxy headers ([dfbd10b](https://github.com/Open-Syria/website/commit/c913e17cf771acc7549bbf9643cc798a526fa8ff))

## [0.4.1](https://github.com/Open-Syria/website/compare/v0.4.0...v0.4.1) (2026-07-08)


### Bug Fixes

* render dataset pages with runtime catalog data ([33f0abd](https://github.com/Open-Syria/website/commit/e495a31750749a0209d67e503c63f2b2adcaa67c))
* restore stable dataset page rendering ([c71bc76](https://github.com/Open-Syria/website/commit/3342afa5f73bc9d707d6171f87aba62ec05a3715))
* simplify footer repository links ([420f0bf](https://github.com/Open-Syria/website/commit/2f6de701df97b790a1dfeaa3c5ab359fb8c602f4))

## [0.4.0](https://github.com/Open-Syria/website/compare/v0.3.4...v0.4.0) (2026-07-08)


### Features

* add dataset breadcrumbs ([368abf2](https://github.com/Open-Syria/website/commit/3566b425563e5a3711f6bf774aafe47da20f1c60))
* add transport dataset catalog ([a06ca75](https://github.com/Open-Syria/website/commit/7937e79ae323a261a73ed2c95f871f61e889d698))


### Bug Fixes

* route public seed datasets ([b7fa10e](https://github.com/Open-Syria/website/commit/d8aa95cd291d030e4427064f81b3e8f6f4a7cff0))
* stabilize locale redirects and clean README ([c2197c4](https://github.com/Open-Syria/website/commit/edbf41e9571bad51cad6db9a761b741d19a0f456))

## [0.3.4](https://github.com/Open-Syria/website/compare/v0.3.3...v0.3.4) (2026-07-07)


### Bug Fixes

* align dataset keyword card ([a4a1fcf](https://github.com/Open-Syria/website/commit/3bb2c7c74371d0dbf07e3b11a0caae8ab41e7fa7))

## [0.3.3](https://github.com/Open-Syria/website/compare/v0.3.2...v0.3.3) (2026-07-06)


### Bug Fixes

* repair pnpm lockfile ([b51cd44](https://github.com/Open-Syria/website/commit/fb5ca644b060859f933764bf1f1336001a9d4fb0))

## [0.3.2](https://github.com/Open-Syria/website/compare/v0.3.1...v0.3.2) (2026-07-06)


### Bug Fixes

* add landing faq and dataset schema metadata ([112bb1b](https://github.com/Open-Syria/website/commit/53733101917f479589152db64f61414e06daab0e))
* normalize robots host directive ([9734a6f](https://github.com/Open-Syria/website/commit/21abe394080087993011faef5ac966673099e5be))

## [0.3.1](https://github.com/Open-Syria/website/compare/v0.3.0...v0.3.1) (2026-07-05)


### Bug Fixes

* restore favicon assets ([a47fdd5](https://github.com/Open-Syria/website/commit/8b4cc972d7a8eb8e0b70df05929fcd23ebad427a))

## [0.3.0](https://github.com/Open-Syria/website/compare/v0.2.1...v0.3.0) (2026-07-04)


### Features

* improve website discovery and previews ([5afd533](https://github.com/Open-Syria/website/commit/213a66bcfd0944c3dc72f2ec2ca3956c0b207799))


### Bug Fixes

* bust social preview caches ([99070f0](https://github.com/Open-Syria/website/commit/a79a09dc283c32421acc3abd4a40e9002d36f943))
* improve dataset SEO metadata ([34068d1](https://github.com/Open-Syria/website/commit/7394baddcef90bdbc6bc3aeb7d95b98584663f3d))
* refine brand preview layout ([cba45e5](https://github.com/Open-Syria/website/commit/7dc3479a54648f797029e7558309d5420490507d))
* refresh OpenSyria brand previews ([d8d8e7e](https://github.com/Open-Syria/website/commit/8569eaa180309c5d8262b48b1d04a54387f20c7d))
* restore website logo component ([00e8f60](https://github.com/Open-Syria/website/commit/75593a6f3f1a5592946914195dfa8062f5c79a30))

## [0.2.1](https://github.com/Open-Syria/website/compare/v0.2.0...v0.2.1) (2026-07-03)


### Bug Fixes

* clarify agent discovery metadata ([9aa5283](https://github.com/Open-Syria/website/commit/a8282357065fd31d2a57c3ed6425daea6d9702d8))
* format llms markdown links ([cfcc7e2](https://github.com/Open-Syria/website/commit/dd2bd520f31390019d4562e9ebf956a87e3b0433))

## [0.2.0](https://github.com/Open-Syria/website/compare/v0.1.1...v0.2.0) (2026-07-03)


### Features

* add branded dataset home surface [skip ci] ([1817621](https://github.com/Open-Syria/website/commit/dd1499a4dcb937c8080efd66b1cf3db510a38175))
* add dataset catalog pages [skip ci] ([39e26d9](https://github.com/Open-Syria/website/commit/6d894bf914f00156ec32ff2259664cb6ae6ab7e0))
* add website agent discovery ([df285bf](https://github.com/Open-Syria/website/commit/88908329c03277ddc3058a545ea62aebff83f42a))
* refresh website experience [skip ci] ([2d068e4](https://github.com/Open-Syria/website/commit/b93add55b50d497cc6cd0d05d41c474b0798b376))
* use base ui navigation menu [skip ci] ([f11e3d0](https://github.com/Open-Syria/website/commit/ec6cfeaf18ac6b6aec338f7261bcccabc09840a9))


### Bug Fixes

* add localized error routes [skip ci] ([9350f02](https://github.com/Open-Syria/website/commit/0a251c2891be130b204182a4da5dd6a083149638))
* harden website tracking query handling ([72c9915](https://github.com/Open-Syria/website/commit/c640cb2755000836ce9dd81aa84f5033977d66dc))
* improve Arabic website copy ([78a7be1](https://github.com/Open-Syria/website/commit/0cc20eb20a65cb7d84d01fe0c07d056fb2e32522))
* polish external links and RTL API routes ([7769244](https://github.com/Open-Syria/website/commit/e9bd6b2a60f7724d827ea829422a7069924fc27e))
* restore homepage controls ([afa4d05](https://github.com/Open-Syria/website/commit/4def97f0b879171c948d19fb46c4fb563ca27251))

## [0.1.1](https://github.com/Open-Syria/website/compare/v0.1.0...v0.1.1) (2026-07-01)


### Bug Fixes

* render robots flag as ascii ([b6f6552](https://github.com/Open-Syria/website/commit/c195f67b6c6dda0e8033eeb9bab17beaf148b452))

## [0.1.0](https://github.com/Open-Syria/website/compare/v0.0.2...v0.1.0) (2026-07-01)


### Features

* add branded robots route [skip ci] ([6242c99](https://github.com/Open-Syria/website/commit/ce5a3540bd2fe225b3bdca9be2ef6f00523b0577))
* refine hero github button and robots branding ([98ab38b](https://github.com/Open-Syria/website/commit/d7917776f85a2e972dfc66779eff2436d91bb667))


### Bug Fixes

* restore static robots file [skip ci] ([71c184c](https://github.com/Open-Syria/website/commit/9519976404ac3c0586916acf6bcd0b1b1959b4ec))

## [0.0.2](https://github.com/Open-Syria/website/compare/v0.0.1...v0.0.2) (2026-06-30)


### Bug Fixes

* install official Google Tag Manager snippet ([ec73ab3](https://github.com/Open-Syria/website/commit/d8d9bca8ad04e5cc4dd308a22a42d0002b2c637c))
* support Google tag tracking ([b1ecb21](https://github.com/Open-Syria/website/commit/ed0cdae0916ab991ec6005166f6a5f7a1f41534d))

## Changelog

## Unreleased

- Add the production OpenSyria landing page.
- Add English and Arabic locale routing.
- Add SEO metadata, Open Graph and Twitter images, sitemap, robots, and manifest routes.
- Add GitHub organization stars and contributor attribution.
- Add Google Tag Manager support for page analytics and CTA click events.
- Add standalone Docker runtime, blue/green deployment files, and production GitHub Actions workflow.
- Add production-ready repository and deployment documentation.
- Add release-please version and changelog automation.
