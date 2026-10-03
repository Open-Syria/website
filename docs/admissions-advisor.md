# Admissions advisor

The localized `/admissions` page compares marks with 2026–2027 Ministry application requirements using shadcn/Base UI, IBM Plex Sans Arabic and next-intl.

## Coverage and source review

The catalogues contain **10,494 choices across twenty-four certificate/applicant catalogues**:

| Certificate branch | Public choices | Private choices | Imported PDF pages |
| --- | ---: | ---: | --- |
| Defence/security: scientific, either origin | 23 | 0 | Announcement 2: 21; announcement 8: 32 |
| Defence/security: literary, either origin | 4 | 0 | Announcement 4: 8; announcement 8: 40 |
| Defence: Syrian Sharia | 2 | 0 | Announcement 4: 8; announcement 1: 7 |
| Defence: vocational, either origin | 2 | 0 | Announcement 6: 11; announcement 10: 6 |
| Faculty-family: Syrian vocational | 291 | 0 | Announcement 6: 4–24; announcement 1: 11 |
| Special quotas: Syrian scientific | 623 | 0 | Announcement 2: 1–20 |
| Special quotas: Syrian literary | 225 | 0 | Announcement 4: 1–7 |
| Special quotas: Syrian Sharia | 183 | 0 | Announcement 4: 1–7 |
| Syrian scientific | 780 | 389 | Announcement 2: 1–20; announcement 7: 10–32 |
| Older scientific, Syrian/equivalent / Arab-foreign | 0 | 389 per category | Announcement 7: 10–32 |
| Older literary, Syrian/equivalent / Arab-foreign | 0 | 131 per category | Announcement 7: 33–40 |
| Older vocational, Syrian/equivalent / Arab-foreign | 0 | 536 per category | Announcement 7: 41–63 |
| Syrian Sharia | 242 | 131 | Announcement 4: 1–7; announcement 7: 33–40 |
| Syrian literary | 265 | 131 | Announcement 4: 1–7; announcement 7: 33–40 |
| Syrian vocational | 291 | 536 | Announcement 6: 5–24; announcement 7: 41–63 |
| Non-Syrian scientific | 618 (parallel) | 389 | Announcement 8: 14–31; announcement 7: 10–32 |
| Non-Syrian literary | 217 (parallel) | 131 | Announcement 8: 33–39; announcement 7: 33–40 |
| Non-Syrian vocational | 241 (parallel) | 536 | Announcement 10: 3–20; announcement 7: 41–63 |
| Arab/foreign scientific, either certificate origin | 618 (Arab/foreign public) | 389 | Announcement 9: 9–29; announcement 7: 10–32 |
| Arab/foreign literary, either certificate origin | 217 (Arab/foreign public) | 131 | Announcement 9: 30–37; announcement 7: 33–40 |
| Arab/foreign vocational, either certificate origin | 241 (Arab/foreign public) | 536 | Announcement 11: 4–20; announcement 7: 41–63 |

Syrian scientific nursing schools have no parallel track; every other included Syrian public row has both general and parallel. Announcement 8 ordinary public rows offer parallel admission only. Nineteen Sharia-certificate-only rows in announcement 4 are excluded from the literary route and included in the Sharia route instead of the corresponding literary faculty rows. The Sharia route excludes 23 intermediate Sharia/Arabic institute rows requiring direct registration (PDF 3 p4). Two naval rows in announcement 6 are excluded from ordinary admission and imported separately in the defence catalogue. Campus, regional quota, subject-ranking and vocational qualification variants retain separate source identities. Counts describe route-specific choices, not distinct degrees or universities: the same private tables apply to the corresponding Syrian and non-Syrian academic/vocational certificates.

For combined public/private admission, Syrian/equivalent applicants must hold a **2026 Syrian scientific, literary, Sharia or vocational certificate, or a recognised non-Syrian scientific/literary/vocational equivalent**. Announcements 9 and 11 additionally support **Arab/foreign applicants with Syrian or accepted non-Syrian scientific/literary/vocational certificates from 2025 or 2026**. These three catalogues cover both origins and years without duplicating rows. Syrian citizens, including dual nationals, use Syrian/equivalent admission. Arab/foreign holders of a Syrian 2026 certificate with continuous schooling in Syria from grade 9 through secondary school may choose Syrian/equivalent admission instead (PDF 9 p4 and PDF 11 p3); the form explains this choice without inferring nationality from certificate origin.

Non-Syrian Sharia certificates, Sharia certificates for other applicant categories, older Sharia private admission, future certificate years and direct language-department registration remain outside the calculator. Defence separately supports Syrian Sharia certificates from 2024–2026 under PDF 1 p7. All eleven announcements and the support-centre directory remain linked.

Syrian Sharia admission follows PDF 3 pp1–4 and PDF 4 pp1–7. The ordinary percentage averages religious subjects as one course. The 19 dedicated Sharia faculty rows use a separate official percentage after adding religious-subject marks (PDF 4 p5, continued on p6), with 55% general and 50% parallel minimums. The form accepts that percentage optionally; missing values produce pending results rather than falling back to the ordinary score. No unpublished denominator/formula is inferred. The dedicated rows do not inherit the literary rows’ 60% religion/Arabic conditions. Regional quotas and prior general acceptance still apply. All 131 private Table 2 choices remain available under the literary-equivalent rule.

Syrian scientific totals are out of 2400; Syrian literary totals are out of 2200. Both include religious education and exclude the lower foreign-language mark. Vocational applicants enter the official percentage because the denominator depends on the profession, and must select their exact certificate specialty. Regular and dual education remain distinct where listed. The 48-option selector includes an “another specialty” option which matches only choices explicitly open to all professions; similar names are never used to infer eligibility.

Non-Syrian scientific/literary applicants enter the official certificate percentage without a deduction (announcement 8 pp1–2). Turkish certificates use the diploma average. Equivalence, branch recognition and registration of the official data must be completed at the Education Directorate's examinations office; the form does not calculate equivalence. No subject marks or Syrian total denominator apply. PDF 7 pp4–5 expressly refers these applicants to the same private tables, so the builder reuses their reviewed rows and adds route-specific source references and stable IDs.

Announcement 9 has its own `arab_foreign` public channel. Syrian certificates retain the 2400/2200 comparison denominators; non-Syrian certificates require the official percentage. Neither origin uses subject marks or the Syrian prior-general-admission restriction in this applicant route (pp1–2). Five male-only oil/gas/railway choices require birth in 2000 or later and a post-admission assessment, and carry the no-state-employment-obligation note (pp2–3, 7, 28). Private tables are reused under PDF 9 p2 and PDF 7 p5.

Announcement 10 covers non-Syrian vocational equivalents from 2026 for Syrian/equivalent applicants. The official certificate percentage is used without a deduction (p2); the form requires the exact Syrian qualification listed in the official equivalence record, including issuer/profession and regular/dual distinctions. The existing 48-option configuration is reused without changes. Ordinary public admission is parallel; private Table 3 rows are explicitly supported by PDF 7 p6. The three railway rows preserve male-only, birth-year 2003 and post-admission medical requirements. The two naval choices on p6 are imported separately in the defence catalogue. Older certificates use the separate private-only catalogues described below.

Announcement 11 covers Arab/foreign applicants with Syrian or officially equivalent non-Syrian vocational certificates from 2025 or 2026. Public choices use `arab_foreign`; private Table 3 is authorized by PDF 7 pp6–7. The form uses the official percentage and the same exact qualification selector. Three railway choices require male applicants born in 2000 or later, with medical/interview checks after admission; the source exempts Arab/foreign students from state-employment obligations. Arts, music, applied-arts and tourism tests remain pending before-application conditions. The PDF's p3 table introduction repeats PDF 10 wording; the cover and explicit p2 rule define this route's category and years.

Optional fields adapt to the certificate and applicant category: subject marks and previous general acceptance appear only for applicable ordinary/special-quota Syrian academic routes; architecture appears for scientific routes except defence/security. Defence/security uses the official percentage and hides unrelated subject, architecture and separate Sharia faculty scores. Gender and birth year remain available where relevant. The shared eligibility dialog opened from result tracks accepts actual subject percentages, the separate Sharia faculty percentage, birth year, gender, previous general-admission status, official eligibility governorate and pre-application test results. A preferred study location does not establish origin or schooling eligibility. Unknown requirements, manual approvals and post-admission assessments remain pending. This tool neither predicts acceptance nor submits an application.

Twenty-four route-specific runtime catalogues live under `src/app/[locale]/admissions/_data/2026-2027/`: `scientific.json`, `literary.json`, `sharia.json`, `vocational.json`, the three `non-syrian-*.json` files, the three `foreign-*.json` files, six `older-*.json` private-only files, four `special-*.json` quota files, and four `service-*.json` defence/security files. They use the small shared `vocational-options.json` form configuration. Every choice records its announcement, PDF viewer page and extracted grid row; defence/security references also identify the table when a page has more than one. Document URLs, SHA-256 hashes, page counts, version and review date accompany each catalogue. An explicit "all applicants" threshold becomes `null`; an unavailable track is omitted, never treated as unrestricted admission.

The source review consists of one full visual pass and targeted follow-up checks, **not independent external validation**. The [source audit](admissions-source-audit.md) distinguishes imported tables from documents cataloged for other routes and records the literary/vocational name and classification corrections. Announcement 2 page 18 requires **60% mathematics for both general and parallel computing-institute admission**, correcting the preview. Subject-ranked choices retain their subject thresholds. Prior general acceptance blocks only the general track.

Names remain in Arabic where there is no curated English translation. Scientific/literary public entries are grouped by the Ministry's city column rather than assigning unverified university affiliations. Vocational tables explicitly name parent universities; those affiliations are retained. Ministry-supervised institutes retain their supervising authority in a note.

## Reproducible updates

Original extracted cells, page counts and document metadata live in `scripts/admissions/2026-2027`. Shared `catalogue.py` and `pdf_tables.py` keep parsing consistent; `normalize.py`, `domestic.py` and `academic.py` correct reviewed Arabic font-map artifacts and certificate names. Builders reject unparsed thresholds, conditions or vocational qualifications. Rebuild with:

```sh
python scripts/admissions/build.py
python scripts/admissions/build_domestic.py
python scripts/admissions/build_sharia.py
python scripts/admissions/build_special_quotas.py
python scripts/admissions/build_vocational_faculty_family.py
python scripts/admissions/build_service_admission.py
python scripts/admissions/build_older_private.py
python scripts/admissions/build_non_syrian.py
python scripts/admissions/build_foreign.py
python scripts/admissions/build_non_syrian_vocational.py
python scripts/admissions/build_foreign_vocational.py
pnpm test:admissions
```

To reproduce extraction, install `PyMuPDF==1.27.2.2`, download the PDFs listed in `source-catalogue.json`, and run:

```sh
python scripts/admissions/extract.py --pdf-dir /path/to/pdfs --output /path/to/review/rows.json --render-dir /path/to/review/pages
python scripts/admissions/extract_domestic.py --pdf-dir /path/to/pdfs --output-dir /path/to/review
python scripts/admissions/extract_special_quotas.py --pdf-dir /path/to/pdfs --output /path/to/review/special-quota-rows.json
python scripts/admissions/extract_service_admission.py --pdf-dir /path/to/pdfs --output /path/to/review/service-admission-rows.json
python scripts/admissions/extract_non_syrian.py --pdf-dir /path/to/pdfs --output-dir /path/to/review
python scripts/admissions/extract_foreign.py --pdf-dir /path/to/pdfs --output-dir /path/to/review
python scripts/admissions/extract_non_syrian_vocational.py --pdf-dir /path/to/pdfs --output-dir /path/to/review
python scripts/admissions/extract_foreign_vocational.py --pdf-dir /path/to/pdfs --output-dir /path/to/review
```

The extractors verify pinned hashes and resolve merged cells by geometric containment. The Syrian inputs contain 1,169 scientific, 415 literary and 829 vocational rows; every row is imported or explicitly excluded with its reason. Announcement 8 adds 618 scientific and 217 literary ordinary public rows. Announcement 9 separately adds 618 scientific and 217 literary public rows. Announcement 10 adds 247 raw public grid rows: 241 choices, two excluded military rows, and four merged continuations retained as extra source references. The reviewed `non-syrian-vocational-corrections.json` maps 62 exact extracted values across 240 cell occurrences to their visually checked text; original raw cells remain intact. Its manifest pins the corrections and shared specialty options as well as source/private inputs. Announcement 11 adds 244 raw public grid rows: 241 choices and three merged continuations. Its correction file records 77 reviewed mappings across 395 cell occurrences, applied by exact coordinates because missing text can represent different cities. The Sharia builder reuses all 415 literary extracted rows, accounts for 373 imports and 42 exclusions, and pins the prerequisite literary catalogue. The four non-Syrian/Arab-foreign builders must run after the Syrian builders to reuse the private rows; manifests pin both extracted rows and the prerequisite catalogue bytes. Those ordinary-route manifests document exclusions imported separately by the defence/security builder and the remaining direct language registration exclusions, and exclude older years from the combined public/private routes. The six older-private manifests account for those years separately. Compare new rows and rendered pages before replacing source data; update provenance/version, rebuild and deploy. Format source JSON before rebuilding so manifest checksums describe the checked-in bytes. References use PDF viewer pages, because the private document restarts printed numbering. PDFs are not committed as binaries. Generated runtime catalogues are excluded from formatting and checked through schema/source-row tests.

## Performance and caching

Matching needs no admissions database, Redis service or matching API. The optional marks lookup uses a separate, bounded SQLite store for expiring abuse-control counters and tickets, never student records. Only the selected certificate route loads through a dynamic import emitted as a versioned Next.js asset. Syrian scientific JSON is about 846 KiB / 36 KiB gzip, literary 300 KiB / 15 KiB gzip, and vocational 820 KiB / 31 KiB gzip. Non-Syrian scientific is about 635 KiB / 29 KiB gzip and literary 217 KiB / 12 KiB gzip. The shared specialty configuration is about 10 KiB / 2 KiB gzip. The two Arab/foreign academic catalogues have sizes comparable to the non-Syrian academic catalogues. Non-Syrian vocational is about 711 KiB / 29 KiB gzip; Arab/foreign vocational is about 724 KiB / 29 KiB gzip. These are source JSON sizes; emitted JavaScript and transfer compression vary. Full catalogues are not serialized into initial HTML/RSC. Marks are evaluated in the browser. This size does not require SQLite or a matching server.

Results paginate eight institution groups and six choices within each group. Every group starts closed, including after filter changes and reloads. An opened group's heading sticks to the top of the viewport until its content ends. Filtering searches the entire catalogue. Pagination and closed accordions keep the rendered DOM bounded. Padding inside accordion panels preserves card rings and shadows.

Below the medium breakpoint, a Filters and sorting button opens a shadcn/Base UI dialog. The filter body scrolls while the header and action footer stay visible. Changes are drafted with a matching-choice count and apply together when submitted; closing the dialog discards the draft. Desktop filters remain inline. Both layouts reuse the same fields and URL state.

A visible Saved choices button with a count sits above the results, outside the filters; on mobile it appears beside Filters. It opens the saved list for the current certificate, clears competing result filters and includes saved choices whose requirements are unmet. Pressing it again returns to ordinary results. The button uses the existing `fav` URL state, and an empty saved list explains the bookmark action.

Each applicable admission-track container has an action that opens the shared eligibility dialog. Answered tracks offer a quieter Edit answers action so students can correct or clear their information. Questions are limited to the selected track and deduplicated by answer; tracks blocked by the main score or certificate profile do not request irrelevant answers. Prior-general-admission questions therefore stay out of parallel-only and private-only choices. Track-specific thresholds and restrictions remain on the choice cards. The dialog keeps its question set stable while editing, so answering does not remove the active control. Numeric answers save valid percentages or birth years on blur or Enter; the return button keeps invalid entries visible for correction. Exam answers distinguish passing, failing and not having a result yet. Selected answers use the primary colors. Shared inputs use the same form validation and eligibility engine, with nuqs URL state synchronized across the edit form, reloads and browser navigation. Undo restores the last answer and URL.

While the dialog is open, the reading surface retains its current layout. On close, results regroup using the updated answers and restore the clicked control's viewport offset and focus, including moves between result pages. If the choice is filtered out, the dialog explains that outcome, the next surviving choice anchors the reading position, and a notice offers Undo. If no choices remain, focus returns to the result summary. Official approvals and post-admission checks cannot be bypassed by a student answer.

Reserved local and eastern quota rows ask which governorate issued the secondary certificate. PDF 1 p5(7), p6(1) and PDF 3 p4(5) ground the structured governorate conditions. Matching, non-matching and missing answers produce checked, ineligible and pending outcomes respectively, subject to the track's other rules. Ordinary rows labelled “محافظات” do not impose a reserved-origin restriction; PDF 1 p6(4) explicitly permits eastern applicants to list ordinary general/parallel choices too. The source parser also recognises “أبناء” without the leading lam, including scientific PDF 2 p14 row 6. Special quotas inherit applicable origin conditions while retaining their required official approvals.

If a local preview remains on the initial loading message before showing the form, check its JavaScript requests. A production server left running while `.next` is rebuilt can serve old HTML referencing deleted chunks, and can write that old page back into the shared ISR cache. Stop all production previews using the checkout, rebuild, restart one preview and reload. Restarting alone may retain a stale generated page. Agent-readiness checks now request every initial admissions script for both locales and require successful JavaScript responses. This catches missing assets even when the HTML itself returns 200; browser checks still verify hydration and deferred catalogue loading.

Ordering prioritizes confirmed matches, then conditional choices, then unmet requirements when requested. Within each status, faculties/applied colleges precede institutes; public tracks precede private, with general before parallel for Syrian/equivalent admission. Career guidance or the selected alphabetical order breaks ties. An institution may have separate status/track groups so conditional choices never precede confirmed matches. A choice is listed once, using its first track with the displayed status; all of its selected tracks remain visible on the card.

Favourites use year-scoped local storage shared across languages, branches and tabs; results show saved choices for the selected certificate. Valid submitted answers, including branch and vocational specialty, use session storage so this tab can restore results after reload; **Clear my answers** clears the session, answer URL state and result filters without deleting favourites. Changing certificate clears the score and subject inputs and resets result pagination. Switching catalogue, special quota or defence/security route resets the admission-track filter to all while retaining other filters. Applicant category and actual certificate year determine which catalogue loads, including on session restoration. Crossing the private-only year boundary clears the score and resets percentage mode to avoid reinterpreting an old total. Applicant category and certificate year are stored explicitly; older sessions migrate to 2026, the standard admission route and an empty optional Sharia faculty score. Invalid stored input is discarded. If storage is unavailable, calculations continue and the favourites hint explains the limitation. The main certificate score and profile stay in the tab; optional eligibility answers appear in the URL.

Filters, ordering and both pagination levels use nuqs with explicit defaults and `urlKeys`: `q` (search), `g` (study governorate), `f` (field), `c` (track), `s` (status), `fav` (saved only), `o` (order), `p` (group page) and `pp` (pages within visible groups). Default values are omitted. Updates replace history, remain client-side and preserve unrelated parameters. Filter changes reset pagination. The language switch preserves the query string. A route-local adapter and Suspense boundary keep personalized URL state outside the cached guide and metadata.

The `a` parameter contains a validated JSON snapshot of optional eligibility answers: subject percentages, Sharia faculty percentage, birth year, gender, prior general admission, exam outcomes and eligibility governorate. It is separate from the study-governorate filter. Unanswered fields are omitted; clearing the last answer sets the nuqs value to `null` and removes `a` completely. The URL takes precedence over stored answers. Version 1 sessions migrate their optional answers once; version 2 sessions never restore missing URL answers from stale storage. Removing `a` clears optional answers in an active or version 2 tab. A new tab with only `a` pre-fills those answers and still requires the student's main score and certificate details. Invalid URL snapshots are ignored. Filter-only reset preserves answers; full reset removes both.

Cache Components are enabled. The validated server loader and localized structured data use `use cache` with `cacheLife("max")`. Both languages are prerendered; the shared GitHub footer retains its hourly cache lifetime. Neither cache includes student answers. The route sends no marks to a matching endpoint or custom analytics event; existing site-wide analytics still applies.

## Career guidance and discovery

Positive badges describe promising, varied and specialist career paths. They are editorial guidance independent of student marks and institution prestige. The visible methodology links ILO industrial-skills/recovery reports, World Bank reconstruction needs and WHO health-sector evidence, reviewed 2026-10-03. These are **not graduation-year employment forecasts**, salaries or official degree rankings. Actual roles depend on qualifications, experience and licensing. Alphabetical sorting is available.

Both language routes have localized metadata covering Syrian and non-Syrian certificates, canonical/hreflang, Open Graph/Twitter images, breadcrumbs and FAQ JSON-LD matching the 34 visible questions. Only the first FAQ opens by default, following the configured question order. All answers are included in the server-rendered HTML; Base UI's `hiddenUntilFound` keeps collapsed panels mounted and lets supported browsers reveal matches from find-in-page. The guide is indexable and in the sitemap; personalized result combinations use the same canonical page. These route-local catalogues are not separate `/datasets` API resources, so they do not add entries to the API dataset registry or its discovery list. External sources use HTTPS and `noopener noreferrer`, without `nofollow`. Keep the footer link; the homepage promotion has a TODO to remove it after this admissions period.

Query variants receive `X-Robots-Tag: noindex, follow` from the proxy while the clean English/Arabic URLs remain indexable. This covers search, governorate, field, admission track, eligibility status, saved-only views, sorting, pagination and unknown page parameters. Tracking parameters redirect away; valid filters remain usable. The internal `_rsc` transport parameter is exempt. Robots permits crawling so search engines can see the header. Applying the header per response avoids making the cached clean page depend on filters or private answers. Agent-readiness checks verify the entire sitemap, metadata, language alternatives, structured data, social-image assets, redirects and query/clean request isolation.

## Verification

`pnpm test:admissions` checks every imported row/track, thresholds, source references, exact score boundaries, conditional admissions, subject-ranked choices, private exams, sorting, short URL keys/defaults, malformed browser storage, translation keys and form validation. Integer hundredths and original denominators prevent rounding into eligibility. Arabic and Persian digits are accepted.

Browser checks cover both languages, narrow screens, shadcn controls, filtering, pagination, saving, reset, card-edge clearance and accessibility scans. Production checks cover cache headers, deferred loading, metadata, visible FAQ markup and source links. An independent admissions review and screen-reader testing remain useful release checks. Recheck Ministry corrections before publishing a new edition.

## Older certificates — private-only admission

PDF 7 pp4–6 authorizes Syrian/equivalent applicants with Syrian or officially equivalent non-Syrian scientific, literary and vocational certificates from 2025 and earlier. Pages 5–7 authorize Arab/foreign applicants from 2024 and earlier. The announcement sets no earlier-year cutoff. The form accepts an actual four-digit year up to 2026; it uses the official admission percentage for older private admission and does not infer historical denominators. Private transfer/change-of-admission procedures on p2 are outside this secondary-certificate calculator. Older Sharia private admission is not inferred from the 2026-specific equivalence rule in PDF 3. The separate defence route follows the explicit Sharia provision in PDF 1 p7.

Six catalogues reuse the fully reviewed private tables: 389 scientific, 131 literary and 536 vocational choices for each applicant category, sharing both certificate origins. They contribute 2,112 route-specific entries. These counts include repeated private programmes across eligible routes, not new degrees. `build_older_private.py` runs after the scientific/domestic builders; each manifest pins the prerequisite catalogue and raw table bytes, counts every private row and records category/year source references. The ten earlier catalogues and vocational options remain unchanged.

The scope's `certificateYear` remains the edition year (2026); `certificateYearMaximum` defines the category's upper bound. The evaluator checks that bound, branch, origin and applicant category and rejects historical totals with guessed denominators. Schema validation requires only private channels and the existing entrance/qualification conditions. It rejects public tracks, subject-minimum rules, prior-general-admission restrictions, mixed year policies and unsupported branch/category/origin changes. All 31 scientific, eight literary and seven vocational entrance-test conditions survive in each applicable category, as do all 536 vocational qualification rules. Previous general acceptance does not restrict these private choices.

Certificate year is a localized numeric text input. Arabic/Persian digits are accepted. Changing between combined and older-private admission clears the score and returns the form to percentage mode. The selected year is passed to catalogue loading both on submit and when restoring tab answers. Changing catalogue resets the channel filter, so a stale public selection cannot hide the new private results. The six assets remain deferred imports; marks stay in the browser.

## Faculty-family and disability quotas

Syrian/equivalent applicants with Syrian 2026 scientific, literary or Sharia certificates can select either special quota. Three separate deferred catalogues hold 623 scientific, 225 literary and 183 Sharia choices. Faculty-family availability is 621 / 220 / 179; disability availability is 225 / 160 / 118 respectively. The two quotas overlap within each catalogue; their channel counts must not be added to the programme count. Only the selected quota is evaluated and displayed. Unsupported years, certificate origins and applicant categories cannot use these catalogues.

The quota columns of PDF 2 pp1–20 and PDF 4 pp1–7 provide their own application and subject minimums. Ordinary subject minimums are not carried over: for example, faculty-family Sharia faculty rows omit the ordinary religion/Arabic requirements, and disability language rows require 50% in the specified language. All-applicant rows have no separate overall threshold. Unavailable quota cells remain unavailable. Dedicated Sharia-certificate faculty rows have blank quota columns; direct-registration institutes remain excluded for Sharia certificates.

PDF 1 p11 and PDF 3 p8 define the faculty-family quota, including the additional 1% allocation, one nationwide group and personnel-directorate verification of qualifying current/former/deceased staff. Scientific allocation also excludes applicants meeting the final ordinary general-admission cutoff; the calculator cannot infer that cutoff from application minimums. Vocational faculty-family admission uses its own catalogue, described below. PDF 6 p4 sets 60% for matching engineering faculties, 50% for other colleges (including applied colleges) and all applicants for matching institutes, subject to tests and vacant places from the scientific faculty-family quota.

PDF 1 pp12–16 and PDF 3 pp9–11 govern disability admission. Each available choice preserves the reviewed disability-type/degree and specialty restrictions as a pending medical-committee condition. The tool does not collect medical details or calculate the disability ranking addition. Published assessment dates are 4–19 October 2026; official approval of the case and chosen specialty is required. Rows with incomplete type information explicitly require Ministry/committee confirmation. Both quotas retain applicable local-quota, gender, age, prior-general-admission and entrance/post-admission assessment conditions. Even when all academic checks pass, special-quota eligibility remains pending official verification.

`extract_special_quotas.py` preserves 1,064 raw grid rows. `special-quota-corrections.json` records 180 visually reviewed cell corrections with exact original values and coordinates, including damaged Arabic font maps and merged cells. `build_special_quotas.py` uses the reviewed ordinary catalogue only for programme identity and applicable common conditions; quota thresholds come from the separate extraction. Three manifests pin all dependencies and account for every imported/excluded row. Rebuild after the scientific, literary and Sharia builders. See the source audit for review limitations and verification evidence.

## Defence and security admission

Four deferred catalogues add 31 choices: 23 scientific (17 defence, six security), four literary (two each), two Syrian Sharia defence choices and two vocational naval qualifications. Scientific, literary and vocational catalogues share Syrian and officially equivalent non-Syrian origins without duplicating programmes. The applicant category is Syrian/equivalent, but security additionally requires Syrian nationality for at least five years; equivalent treatment alone does not satisfy that condition.

Military defence colleges use 70% and academic years 2024–2026. They require male applicants, unmarried status, age no greater than 23 on the application date, minimum height 165 cm, fitness, entrance success, administrative/financial undertakings and the published service obligations. Age on the application date is not inferred from birth year. Eight scientific degree choices at the Higher Institute for Applied Sciences and Technology use 85% and years 2025–2026, accept both genders, and retain their own entrance exam and fee without military-college restrictions. Literary and Syrian Sharia certificates can select legal/social sciences. The two maritime vocational qualifications use 70% and 2026 only, retaining exact navigation/mechanics qualification IDs; the naval campus is Damascus this year and Latakia subsequently.

Security uses scientific/literary certificates from 2025 or 2026. Scientific thresholds are 85% for cyber faculties, 80% for the security faculty and 65% for institutes; literary thresholds are 75% for the faculty and 60% for the institute. Gender restrictions and birth from 1 January 2005 are evaluated when provided. Nationality duration, height/BMI, health/fitness approval, exams/interviews, administrative eligibility, financial/political undertakings and service for 20 years (faculties) or 10 years (institutes) remain official pending conditions. Unknown campus locations are explicitly unspecified. The tool does not request medical, political-affiliation or criminal-history information.

Every choice uses an explicit certificate-year condition, and the form uses only the official percentage. All academically matching results remain pending official checks. Source tables on PDF 2 p21, PDF 4 p8, PDF 8 pp32/40, PDF 6 p11 and PDF 10 p6 preserve 58 raw rows, including both origins. The extractor verifies pinned hashes and resolves merged rows using their shortest cells; the builder checks counterpart thresholds/years and accounts for every row. Curated bilingual programme names were checked against rendered pages. The manifest pins raw cells and exact vocational options. Rebuilds do not require or modify ordinary catalogues.

PDF 1 p9 permits the top ten Syrian 2026 computer-technologies vocational graduates to enter the security competition, but these PDFs provide no programme allocation or score minimum. This remains source-linked guidance rather than invented choices. Direct-registration guidance is covered below; other Sharia categories require explicit supporting rules. The detailed source audit records review and verification evidence.

## Vocational faculty-family quota

`special-vocational.json` supports Syrian/equivalent applicants with Syrian 2026 vocational certificates. It adds 291 route-specific choices under PDF 6 p4 and PDF 1 p11, using the reviewed programme/qualification mappings from PDF 6 pp5–24. Select **Faculty-family quota** and the exact vocational qualification; disability admission and non-Syrian certificates are not inferred for this quota.

| Source group | Choices | Overall application minimum |
| --- | ---: | --- |
| Applied colleges, PDF 6 pp5–7 | 55 | 50% |
| Technical engineering faculties, pp8–10 | 46 | 60% |
| Fine arts/applied fine arts/music faculties, p11 | 5 | 50% |
| Matching institutes, pp12–24 | 185 | No separate minimum |

Classification follows the institution in the source. Technical food/agricultural departments are engineering faculty choices at 60%; engineering-related applied colleges use 50%. Neither career-field labels nor ordinary general/parallel thresholds determine the quota minimum. All 291 exact qualification conditions, 37 entrance/post-admission assessments and three railway gender/birth-year restrictions are preserved. No overall minimum for institutes does not waive qualification matching or official admission requirements. The two naval defence rows and 536 private rows are excluded from this catalogue.

Every academically matching choice remains pending two official checks: eligible faculty-parent status verified by the personnel directorate, and a matching choice appearing in the official application with a vacant place remaining from the scientific faculty-family quota. The static catalogue cannot establish live vacancies or the official applicant-specific choice list. No medical or family records are requested. Hidden academic subject and previous-general-admission fields do not influence the vocational calculation.

`vocational-faculty-family-rules.json` records the reviewed scope, source-page groups, minima, exclusions and pending requirements. `build_vocational_faculty_family.py` runs after `build_domestic.py`, reuses the reviewed vocational catalogue and accounts for all 293 public source rows. Its manifest pins the rules, raw cells, source catalogue, prerequisite vocational catalogue and shared qualification options. Existing catalogues remain unchanged. See the source audit for validation evidence.

## Direct registration and separate applications

The bilingual guide and four source-linked FAQ entries describe procedures outside scored calculator results. They add no catalogue rows and do not reuse ordinary language-department thresholds as direct-registration requirements.

| Procedure | Published scope and action | Source |
| --- | --- | --- |
| Foreign-language departments: Syrian/equivalent applicants | Accepted non-Syrian **scientific** certificate, **2026**, average **at least 50%**. More than half the subjects studied in a foreign language; the department must match the language in which the certificate was awarded. Register directly at the university during accepted students' registration period; non-Syrian-certificate parallel fees apply. | PDF 8 p1 and p3 item 20 |
| Foreign-language departments: Arab/foreign applicants | Accepted non-Syrian **scientific or literary** certificate, **2025 or 2026**, average **at least 50%**, with the same study-language and matching-language conditions. English/French departments additionally require the language entrance test. Direct registration during the competition's accepted-student registration period; Arab/foreign fees apply. | PDF 9 p1 and p3 item 15 |
| Sharia/Arabic intermediate institutes | Sharia-certificate holders contact the institute administration and register directly, outside this announcement. The clause does not publish separate dates or a numerical minimum. The 23 PDF 4 p7 rows remain excluded only from the Sharia calculator route. | PDF 3 p4 item 10; PDF 4 p7 |
| Other ministries' vocational competitions | Syrian vocational-certificate holders seeking Education Ministry technical institutes follow that ministry's separate announcement. Petroleum vocational-certificate holders seeking Energy Ministry oil/gas institutes follow its competition. These clauses do not grant automatic direct registration or supply the separate competition's details. | PDF 6 p3 items 11 and 13 |

The receiving institution confirms documents, registration arrangements and applicable tests. No registration dates, cash fee amounts, live vacancies or admission guarantees are inferred. Published application dates elsewhere in the FAQ are not substituted for the direct-registration period. Guidance uses the hash-pinned PDFs retrieved on 2026-10-03. The final content audit retrieved the Ministry index and all 12 linked PDFs again; their hashes match the reviewed documents.

The guide, FAQ and FAQ structured data share the route-local `content.ts` configuration and localized messages. There are now 34 FAQ entries per language, including the final completeness-review additions below.

## Completed source review

All **309 pages across the 12 pinned PDFs** have completed one visual review;
no pages remain awaiting inspection. `scripts/admissions/2026-2027/visual-review.json`
records page coverage, source hashes and the disposition of the final 24 pages.
This is not an independent second review or a live check for Ministry updates.

The final pass added guidance on application documents, separate entrance-test
registration, private acting/film assessments, post-admission checks and Education
Ministry institute tests. It clarified permanent cancellation versus unfixing a
card, annual parallel service fees, department-specific conditions and support
centre selection. Political-science test sequencing conflicts within PDF 1 p24;
applicants are directed to the faculty for confirmation.

Five Arabic spelling repairs affect 16 displayed names across six catalogues.
Display normalization leaves programme and exam IDs unchanged, including in
derived quota catalogues. Versions and dependent manifests were rebuilt.
All thresholds, eligibility rules and 10,494 choices remain unchanged; the other
18 catalogues and shared vocational options are byte-identical to the pre-review
baseline. The source audit provides page-level findings and verification evidence.


## Optional exam-marks import

For Syrian 2026 scientific/literary certificates, the form can fill total and
subject marks after the student chooses their exam governorate and exact
certificate/curriculum and enters an authorized student number. The browser
fetches the encrypted response. Server processing returns only supported marks;
identity fields are discarded. Unsupported score scales, unknown subjects,
inconsistent totals and non-passing results require manual entry. The initial
live validation covered one authorized scientific result; other responses must
pass the same strict checks. No certificate equivalence is inferred.

Imported marks remain editable. Subject fractions survive display rounding and
tab restoration; a changed subject value overrides its imported fraction.
Applicant category, personal eligibility details and official approvals are
never inferred from the result. The browser-supplied response is advisory input,
not authenticated proof of a certificate. Manual entry always remains available.

The optional endpoint uses a verified Turnstile challenge, a session-bound
single-use ticket and shared per-session, per-address and global limits. Only
expiring hashes/counters and public exam metadata are stored on the server.
Student numbers, result bodies, names and decoder keys must never enter logs,
analytics or public examples. Provider contracts and operator setup remain in
private documentation. Run `pnpm test:results` for decoder, precision, replay,
request-validation and shared-store checks.
