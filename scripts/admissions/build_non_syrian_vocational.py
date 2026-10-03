"""Build PDF 10's 2026 parallel route, with PDF 7 p6 private-table coverage."""
import copy
import hashlib
import json
import re
from collections import Counter
from pathlib import Path
from catalogue import OUT, GOVERNORATES, CITY_GOV, seed, translations, text, stable_id, exam, threshold
from domestic import clean, qualification, option, vocational_program_name, program_field

SOURCE_DIR = Path(__file__).parent/'2026-2027'
KEY = 'non-syrian-vocational'
source = SOURCE_DIR/f'{KEY}-rows.json'
corrections_path = SOURCE_DIR/f'{KEY}-corrections.json'
raw_rows = json.loads(source.read_text(encoding='utf-8'))
corrections = json.loads(corrections_path.read_text(encoding='utf-8'))['corrections']
assert len(raw_rows) == 247
rows = copy.deepcopy(raw_rows)
for correction in corrections:
    matches = [r for r in rows if r[correction['field']] == correction['original']]
    assert [{'page': r['page'], 'row': r['row']} for r in matches] == correction['cells'], correction
    for row in matches: row[correction['field']] = correction['corrected']
for row in rows:
    for k, v in row.items():
        if isinstance(v, str) and k != 'sector': row[k] = clean(v)

options_path = OUT/'vocational-options.json'
options = json.loads(options_path.read_text(encoding='utf-8'))
option_ids = {o['id'] for o in options}
programs, excluded, by_row = [], [], {}
# These partial horizontal grid lines split one merged application choice.
# Retain both source coordinates on the single choice; never merge professions.
duplicate_cells = {(9, 3): (9, 2), (11, 13): (11, 12), (12, 9): (12, 8), (15, 7): (15, 6)}

for row in rows:
    coord = (row['page'], row['row'])
    ident = f'{KEY}-public-{row["page"]:02}-{row["row"]:03}'
    if coord in [(6, 2), (6, 3)]:
        assert row['parallel'] == '70%' and 'وزارة النقل' in row['certificate']
        excluded.append({'id': ident, 'reason': 'military_general_admission'})
        continue
    if coord in duplicate_cells:
        first_coord = duplicate_cells[coord]
        first_row = next(r for r in rows if (r['page'], r['row']) == first_coord)
        assert {k: v for k, v in row.items() if k != 'row'} == {k: v for k, v in first_row.items() if k != 'row'}
        program = by_row[first_coord]
        program['sources'].append({'announcement': 10, 'page': row['page'], 'row': row['row']})
        excluded.append({'id': ident, 'reason': 'merged_grid_continuation', 'mergedInto': program['id']})
        continue

    name = vocational_program_name(row['name'])
    place = row['place']
    kind = 'institute' if 'معهد' in name else 'applied_college' if 'الكلية التطبيقية' in name else 'faculty'
    city = re.split(r'\s[/-]\s', place)[0]
    city = CITY_GOV.get(city, city)
    city = {'جرابلس': 'حلب', 'قامشلي': 'الحسكة', 'سلقين': 'إدلب', 'حارم': 'إدلب'}.get(city, city)
    assert city in GOVERNORATES, row
    gov, city_en = GOVERNORATES[city]
    if row['institution'].startswith('جامعة'):
        institution = {'id': 'public-'+stable_id(row['institution']), 'name': text(row['institution'])}
    else:
        institution = {'id': 'public-institute-'+gov,
                       'name': text('المعاهد الحكومية — '+city, 'Public institutes — '+city_en)}

    category, specialty = qualification(row)
    selected = option(category, specialty) if category and specialty else None
    allowed = [o['id'] for o in options if not category or (o['category'] == category and (not selected or o['id'] == selected['id']))]
    assert allowed and all(i in option_ids for i in allowed), row
    conditions = [{'type': 'vocational_specialty', 'allowed': allowed,
                   'label': text(row['certificate']+' — '+row['profession'], selected['name']['en'] if selected else 'All vocational professions')}]
    refs = [{'announcement': 10, 'page': row['page'], 'row': row['row']}]
    notes = []
    value = row['conditions']
    if value in ['الدوام في كلية الزراعة', 'الدوام حالياً في حمص']:
        notes.append(text(value, 'Classes are held at the Faculty of Agriculture.' if 'الزراعة' in value else 'Classes are currently held in Homs.'))
    elif value:
        if coord[0] == 15:
            assert value == clean('ذكور - مواليد 2003 وما بعد - النجاح في الفحص الطبي بعد صدور نتائج القبول بالمفاضلة وفق ما هو محدد في إعلان رقم 1')
            conditions += [{'type': 'gender', 'value': 'male'}, {'type': 'birth_year', 'minimum': 2003},
                           exam('post-admission-assessment', 'اجتياز الفحص الطبي بعد صدور نتائج القبول وفق الإعلان رقم ١٠.',
                                'Pass the medical assessment after admission under announcement 10.', True)]
            refs += [{'announcement': 10, 'page': 2}, {'announcement': 10, 'page': 21}]
        else:
            if value == 'النجاح في الاختبار الخاص في كلية الفنون شرط لتدوين الرغبة وفق إعلان رقم 1':
                en = 'Pass the arts entrance assessment before applying, under announcement 1.'
            elif value == 'النجاح في الاختبار الخاص في كلية التربية الموسيقية شرط لتدوين الرغبة وفق الإعلان رقم 1':
                en = 'Pass the music education entrance assessment before applying, under announcement 1.'
            elif value == 'بعد النجاح باختبار اللغة الأجنبية المحدد وفق الإعلان رقم 1':
                en = 'Pass the foreign-language entrance test before applying, under announcement 1.'
            elif value == 'إجراء مقابلة تتضمن من خلالها إجراء اختبار باللغة الأجنبية كما هو محدد في الإعلان رقم 1':
                en = 'Pass the interview including its foreign-language test before applying, under announcement 1.'
            else:
                assert value == clean('النجاح في اختبار +الرسم اختبار الخط الختصاص الخط العربي - النجاح اختبار الرسم فقط لباقي االختصاصات وفق ما هو محدد في /إعالن رقم1 /'), value
                en = 'Pass drawing and, for Arabic calligraphy, the calligraphy test before applying, under announcement 1.'
            conditions.append(exam('entrance-'+stable_id(name), value, en))
            refs.append({'announcement': 10, 'page': 21})
    if not row['institution'].startswith('جامعة'):
        notes.append(text('الجهة المشرفة: '+row['institution'], 'Supervising authority: '+row['institution']))
    if kind in ['institute', 'applied_college']:
        notes.append(text('اللغة الأجنبية المعتمدة للدراسة هي الإنكليزية.', 'The designated foreign language of study is English.'))
        refs.append({'announcement': 10, 'page': 21})
    minimum = threshold(row['parallel'])
    assert minimum in [50, 60, None], row
    program = {'id': ident, 'name': text(name, translations.get(name)), 'institution': institution,
               'campus': text(place, city_en if place == city else None), 'governorate': gov,
               'field': program_field(name), 'kind': kind,
               'channels': [{'id': 'parallel', 'minPercent': minimum, 'conditions': conditions}],
               'notes': notes, 'sources': refs}
    programs.append(program)
    by_row[coord] = program
assert len(programs) == 241 and len(excluded) == 6

# PDF 7 p6 explicitly accepts equivalent non-Syrian vocational certificates
# from 2026 using the same Table 3 private rows. Exact qualification IDs remain.
private_path = OUT/'vocational.json'
domestic = json.loads(private_path.read_text(encoding='utf-8'))
private = [copy.deepcopy(p) for p in domestic['programs'] if p['channels'][0]['id'] == 'private']
assert len(private) == 536
for program in private:
    program['id'] = KEY+'-'+program['id'].removeprefix('vocational-')
    program['sources'].append({'announcement': 7, 'page': 6})
programs += private
data = {**seed, 'coverage': KEY, 'version': '2026.1-'+KEY+'.2',
        'scope': {**seed['scope'], 'branch': 'vocational', 'certificate': 'non_syrian'}, 'programs': programs}
assert len({p['id'] for p in programs}) == 777
(OUT/f'{KEY}.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8', newline='\n')
manifest = {'version': data['version'], 'extractedRowsSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
            'correctionsSha256': hashlib.sha256(corrections_path.read_bytes()).hexdigest(),
            'privateCatalogueSha256': hashlib.sha256(private_path.read_bytes()).hexdigest(),
            'optionsSha256': hashlib.sha256(options_path.read_bytes()).hexdigest(),
            'extractedRows': len(raw_rows), 'programCount': len(programs), 'publicCount': 241, 'privateCount': len(private),
            'excludedRows': excluded, 'rowsPerPage': dict(sorted(Counter(str(r['page']) for r in raw_rows).items())),
            'channels': dict(Counter(c['id'] for p in programs for c in p['channels'])),
            'conditions': dict(Counter(c['type'] for p in programs for ch in p['channels'] for c in ch['conditions'])),
            'excludedSections': [{'announcement': 7, 'page': 6, 'reason': 'older_vocational_certificates'}]}
(SOURCE_DIR/f'{KEY}-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8', newline='\n')
print(KEY, len(programs), manifest['channels'], manifest['conditions'])
