"""Build separately selectable defence/security catalogues from reviewed tables."""
import hashlib
import json
import re
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).parent/'2026-2027'
OUT = ROOT/'src/app/[locale]/admissions/_data/2026-2027'
raw_path = SOURCE/'service-admission-rows.json'
rows = json.loads(raw_path.read_text(encoding='utf-8'))
catalogue = json.loads((SOURCE/'source-catalogue.json').read_text(encoding='utf-8'))
options = json.loads((OUT/'vocational-options.json').read_text(encoding='utf-8'))
def text(ar,en): return {'ar':ar,'en':en}
def manual(ar,en): return {'type':'manual','label':text(ar,en)}
def ref(r): return {k:r[k] for k in ['announcement','page','table','row']}
def group(ann,page,route): return [r for r in rows if r['announcement']==ann and r['page']==page and r['route']==route]
def threshold(r): return int(r['cells'][1 if r['announcement']==10 else 2].rstrip('%'))
def years(r): return sorted(int(y) for y in re.findall(r'202[456]',r['cells'][0])) if r['announcement'] not in [6,10] else [2026]

# Curated bilingual names checked against PDF 2 p21 and PDF 8 p32, in grid order.
defence_names = [
 ('الحربية البرية — الهندسة الميكانيكية','Land Military College — Mechanical Engineering','homs','engineering'),
 ('الحربية البرية — الهندسة الإلكترونية','Land Military College — Electronic Engineering','homs','engineering'),
 ('الحربية البرية — الهندسة المعلوماتية','Land Military College — Informatics Engineering','homs','technology'),
 ('الحربية البرية — هندسة الميكاترونكس','Land Military College — Mechatronics Engineering','homs','engineering'),
 ('الحربية البحرية — الهندسة البحرية','Naval Military College — Marine Engineering','damascus','engineering'),
 ('الحربية الجوية — هندسة الطيران','Air Military College — Aeronautical Engineering','aleppo','engineering'),
 ('المعهد العالي للعلوم التطبيقية والتكنولوجيا — المعلوماتية / الذكاء الصنعي','Higher Institute for Applied Sciences and Technology — Informatics / Artificial Intelligence','damascus','technology'),
 ('المعهد العالي للعلوم التطبيقية والتكنولوجيا — المعلوماتية / البرمجيات','Higher Institute for Applied Sciences and Technology — Informatics / Software','damascus','technology'),
 ('المعهد العالي للعلوم التطبيقية والتكنولوجيا — الإلكترونية / الاتصالات','Higher Institute for Applied Sciences and Technology — Electronics / Telecommunications','damascus','engineering'),
 ('المعهد العالي للعلوم التطبيقية والتكنولوجيا — الإلكترونية / نظم التحكم الذكية','Higher Institute for Applied Sciences and Technology — Electronics / Intelligent Control Systems','damascus','engineering'),
 ('المعهد العالي للعلوم التطبيقية والتكنولوجيا — الإلكترونية / الميكاترونكس','Higher Institute for Applied Sciences and Technology — Electronics / Mechatronics','damascus','engineering'),
 ('المعهد العالي للعلوم التطبيقية والتكنولوجيا — الكيميائية / علوم وهندسة المواد','Higher Institute for Applied Sciences and Technology — Chemistry / Materials Science and Engineering','damascus','engineering'),
 ('المعهد العالي للعلوم التطبيقية والتكنولوجيا — الكيميائية / تكنولوجيا الوقود','Higher Institute for Applied Sciences and Technology — Chemistry / Fuel Technology','damascus','engineering'),
 ('المعهد العالي للعلوم التطبيقية والتكنولوجيا — هندسة الطيران / فرع حلب','Higher Institute for Applied Sciences and Technology — Aeronautical Engineering / Aleppo Branch','aleppo','engineering'),
 ('العلوم الإنسانية والإدارية — إدارة واقتصاد','Humanities and Administrative Sciences — Management and Economics','damascus','business'),
 ('العلوم الإنسانية والإدارية — علوم قانونية','Humanities and Administrative Sciences — Legal Sciences','damascus','law'),
 ('العلوم الإنسانية والإدارية — العلوم الاجتماعية','Humanities and Administrative Sciences — Social Sciences','damascus','humanities'),
]
security_names = [
 ('كلية الأمن السيبراني — ذكور','Cybersecurity Faculty — Men','faculty','male',85),
 ('كلية الأمن السيبراني — إناث','Cybersecurity Faculty — Women','faculty','female',85),
 ('كلية العلوم الأمنية — ذكور','Security Sciences Faculty — Men','faculty','male',80),
 ('المعهد التقاني للأمن السيبراني — ذكور','Cybersecurity Technical Institute — Men','institute','male',65),
 ('المعهد التقاني للأمن السيبراني — إناث','Cybersecurity Technical Institute — Women','institute','female',65),
 ('المعهد التقاني للعلوم الأمنية — ذكور','Security Sciences Technical Institute — Men','institute','male',65),
]
cities = {'damascus':text('دمشق','Damascus'),'homs':text('حمص','Homs'),'aleppo':text('حلب','Aleppo')}
institutions = {
 'defence':{'id':'national-university-defence-sciences','name':text('الجامعة الوطنية للعلوم الدفاعية','National University for Defence Sciences')},
 'hia':{'id':'higher-institute-applied-sciences-technology','name':text('المعهد العالي للعلوم التطبيقية والتكنولوجيا','Higher Institute for Applied Sciences and Technology')},
 'security':{'id':'syrian-university-security-sciences','name':text('الجامعة السورية للعلوم الأمنية','Syrian University for Security Sciences')},
}
def defence_conditions(hia=False):
    if hia:
        return [manual('يلزم النجاح في امتحان القبول الذي يجريه المعهد في مقره بدمشق وتسديد رسم التسجيل المطلوب.',
                       'Pass the institute admission examination at its Damascus headquarters and pay the required registration fee.')]
    return [
      manual('يلزم اجتياز امتحان القبول لدى الجامعة قبل تدوين الرغبة، وفق المواعيد والمراكز المعلنة.',
             'Pass the university admission examination before listing this choice, at the announced centres and dates.'),
      manual('يشترط أن يكون المتقدم أعزب، وألا يتجاوز عمره 23 عاماً عند التقدم، وأن يكون سليم البنية ولائقاً بدنياً وطوله 165 سم على الأقل؛ تتحقق الجامعة من هذه الشروط.',
             'The university must verify unmarried status, age no more than 23 on application, sound health and physical fitness, and height of at least 165 cm. Birth year alone does not establish age on the application date.'),
      manual('تتحقق الجامعة من شروط السجل العدلي والتعهد بعدم الانتساب إلى حزب أو تنظيم سياسي أو ممارسة نشاط حزبي طوال الدراسة والخدمة، والتعهدات المالية في حالات الفصل أو الاستنكاف أو الانقطاع وفق الأنظمة.',
             'The university must verify the criminal-record conditions, the undertaking concerning political-party membership/activity during study and service, and financial undertakings for dismissal, withdrawal or interruption under its regulations.'),
      manual('يشترط الالتزام بالخدمة لدى وزارة الدفاع وفق الأنظمة والقوانين النافذة.',
             'Admission requires a commitment to service with the Ministry of Defence under the applicable regulations.'),
    ]
def security_conditions(kind):
    term = 10 if kind=='institute' else 20
    return [
      {'type':'birth_year','minimum':2005},
      manual('يشترط أن يكون المتقدم سوري الجنسية منذ خمس سنوات على الأقل؛ لا تكفي صفة «من في حكم السوري» وحدها لهذا المسار.',
             'The applicant must have held Syrian nationality for at least five years. Equivalent treatment alone does not qualify for this route.'),
      manual('يلزم اجتياز جميع مراحل الفحوص والاختبارات والمقابلات المعتمدة قبل تدوين الرغبة، واعتماد اللياقة الصحية والبدنية والنفسية. الحد الأدنى للطول 170 سم للذكور و160 سم للإناث، ومؤشر كتلة الجسم بين 18 و28 وفق المعايير الرسمية.',
             'Pass all approved examinations, tests and interviews before listing this choice, with official medical, physical and psychological fitness approval. Minimum height is 170 cm for men and 160 cm for women; the published BMI range is 18–28.'),
      manual('تتحقق الجامعة من الأهلية المدنية والسياسية والسجل العدلي وشروط الفصل التأديبي والعمل لدى الجهات العامة أو القوات المسلحة أو الأمن الداخلي، والاستثناءات الخاصة بالترشيح والإيفاد، وأي قبول أو تسجيل سابق متعارض.',
             'The university must verify civil/political capacity, criminal-record and disciplinary-dismissal conditions, restrictions on public-sector, armed-forces or internal-security employment and nomination/secondment exceptions, and incompatible prior admission or registration.'),
      manual(f'يشترط التعهد بالخدمة بعد التخرج لدى قوى الأمن الداخلي أو الجهة المختصة لمدة {term} سنوات، والتعهدات المالية وعدم الانتساب إلى حزب أو تنظيم سياسي أو ممارسة نشاط حزبي طوال الدراسة والخدمة وفق الأنظمة.',
             f'Admission requires a {term}-year service commitment after graduation with internal security or the competent authority, the specified financial undertakings, and the undertaking concerning political-party membership/activity during study and service.'),
    ]

catalogues = {}
for branch in ['scientific','literary','sharia','vocational']:
    programs = []
    def add(r, counterpart, ar, en, route, city, field, kind='faculty',gender=None,hia=False,specialty=None):
        permitted = years(r)
        assert counterpart is None or (threshold(r)==threshold(counterpart) and permitted==years(counterpart))
        conditions = [{'type':'certificate_year','allowed':permitted}]
        if gender: conditions.append({'type':'gender','value':gender})
        conditions += defence_conditions(hia) if route=='defence' else security_conditions(kind)
        if specialty:
            option = next(o for o in options if o['id']==specialty)
            conditions.append({'type':'vocational_specialty','allowed':[specialty],'label':option['name']})
        notes = []
        if city:
            campus = cities[city]
        else:
            city='unspecified'
            campus=text('مكان الدراسة يحدد من الجامعة','Study location to be confirmed by the university')
        if 'البحرية' in ar:
            notes.append(text('الدوام في دمشق لهذا العام فقط، وفي اللاذقية في الأعوام القادمة وفق الإعلان.',
                              'Study is in Damascus for this year only, and in Latakia in subsequent years according to the announcement.'))
        if branch!='sharia':
            notes.append(text('للشهادة غير السورية: يلزم اعتماد المعادلة والفرع والمعدل والبيانات رسمياً قبل التقدم.',
                              'For a non-Syrian certificate, official equivalence, branch recognition, percentage and data registration are required before applying.'))
        sources=[ref(r)] + ([ref(counterpart)] if counterpart else [])
        if route=='defence':
            extra=[(1,7),(1,8)] if branch in ['scientific','sharia'] else [(3,6)] if branch=='literary' else [(6,2),(6,3),(1,7),(1,8),(10,1),(10,2)]
            if branch in ['scientific','literary']: extra += [(8,4),(8,5)]
        else:
            extra=[(1,9),(1,10),(8,6),(8,7)] if branch=='scientific' else [(3,6),(3,7),(8,6),(8,7)]
            if kind=='faculty':
                notes.append(text('عند تساوي المعدل، تُراعى المواد بالترتيب الوارد في جدول الشروط؛ لا تحسب الحاسبة الترتيب النهائي.',
                                  'Equal-score applicants are ordered using the subjects listed in the conditions table. This calculator does not compute the final ranking.'))
        sources += [{'announcement':a,'page':p} for a,p in extra]
        programs.append({'id':f'service-{branch}-public-{r["page"]:02}-{((r["table"]-1)*100+r["row"]):03}',
            'name':text(ar,en),'institution':institutions['hia' if hia else route], 'campus':campus,'governorate':city,'field':field,'kind':kind,
            'channels':[{'id':route,'minPercent':threshold(r),'conditions':conditions}],'notes':notes,'sources':sources})
    if branch=='scientific':
        domestic=group(2,21,'defence'); foreign=group(8,32,'defence')
        assert len(domestic)==len(foreign)==len(defence_names)==17
        for i,(r,f,n) in enumerate(zip(domestic,foreign,defence_names)):
            hia=6<=i<=13
            assert threshold(r)==(85 if hia else 70)
            assert years(r)==([2025,2026] if hia else [2024,2025,2026])
            add(r,f,*n[:2],'defence',*n[2:],gender=None if hia else 'male',hia=hia)
        for r,f,n in zip(group(2,21,'security'),group(8,32,'security'),security_names):
            ar,en,kind,gender,minimum=n
            assert threshold(r)==minimum and years(r)==[2025,2026]
            add(r,f,ar,en,'security',None,'technology' if 'السيبراني' in ar else 'law',kind,gender)
    elif branch in ['literary','sharia']:
        for r,f,n in zip(group(4,8,'defence'),group(8,40,'defence'),defence_names[-2:]):
            assert threshold(r)==70 and years(r)==[2024,2025,2026]
            add(r,f if branch=='literary' else None,*n[:2],'defence',*n[2:],gender='male')
        if branch=='literary':
            for r,f,n,minimum in zip(group(4,8,'security'),group(8,40,'security'),[security_names[2],security_names[5]],[75,60]):
                assert threshold(r)==minimum and years(r)==[2025,2026]
                add(r,f,*n[:2],'security',None,'law',n[2],'male')
    else:
        for r,f,specialty in zip(group(6,11,'defence'),group(10,6,'defence'),['maritime-830da4ff90c9','maritime-9528df3eb4aa']):
            assert threshold(r)==70
            add(r,f,'الحربية البحرية — الهندسة البحرية','Naval Military College — Marine Engineering','defence','damascus','engineering',gender='male',specialty=specialty)
    key=f'service-{branch}'
    data={**deepcopy(catalogue),'coverage':key,'version':f'2026.1-{key}.1','scope':{'branch':branch,'certificateYear':2026,'certificate':'syrian' if branch=='sharia' else 'syrian_or_non_syrian','certificateYears':[2026] if branch=='vocational' else [2024,2025,2026],'applicantCategory':'syrian_or_equivalent','admissionRoute':'service'},'programs':programs}
    (OUT/f'{key}.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8',newline='\n')
    catalogues[key]=programs
    print(key,len(programs))
assert sum(len(p) for p in catalogues.values())==31
used={(s['announcement'],s['page'],s['table'],s['row']) for ps in catalogues.values() for p in ps for s in p['sources'] if 'table' in s}
assert used=={(r['announcement'],r['page'],r['table'],r['row']) for r in rows}
manifest={'version':'2026.1-service.1','sourceRowCount':len(rows),'extractedRowsSha256':hashlib.sha256(raw_path.read_bytes()).hexdigest(),'vocationalOptionsSha256':hashlib.sha256((OUT/'vocational-options.json').read_bytes()).hexdigest(),'catalogues':{k:len(v) for k,v in catalogues.items()},'sourceReview':'All 58 table rows visually checked; curated bilingual names follow the rendered tables. Both origins share matching rows, with both source references retained. Syrian Sharia defence eligibility is explicit in PDF 1 p7.','exclusions':[{'announcement':1,'page':9,'reason':'Top-ten Syrian 2026 computer-technologies vocational graduates may enter the security competition, but no programme allocation or application minimum is supplied; guidance only.'}],'verification':'Entrance, health, age-on-application, nationality, administrative and service-commitment conditions require official confirmation. No medical, political-affiliation or criminal-record data is collected.'}
(SOURCE/'service-admission-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
