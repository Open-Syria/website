"""Build literary and vocational catalogues from pinned source rows and reviewed certificate mappings."""
import hashlib
import json
import re
from collections import Counter
from pathlib import Path
from catalogue import OUT, GOVERNORATES, CITY_GOV, seed, translations, text, display_name, stable_id, manual, exam, table_conditions, threshold, regional_conditions
from domestic import clean, qualification, option, vocational_program_name, program_field

source_dir = Path(__file__).parent/'2026-2027'
vocational_rows = json.loads((source_dir/'vocational-rows.json').read_text(encoding='utf-8'))
for row in vocational_rows:
    for key, value in row.items():
        if isinstance(value, str) and key != 'sector': row[key] = clean(value)
qualifications = {qualification(row) for row in vocational_rows}
options = [option(category, specialty) for category, specialty in sorted(q for q in qualifications if all(q))]
options.append({'id': 'other-vocational-specialty', 'category': 'other', 'name': text('اختصاص مهني آخر', 'Another vocational specialty')})
option_ids = {(category, specialty): option(category, specialty)['id'] for category, specialty in qualifications if category and specialty}
(OUT/'vocational-options.json').write_text(json.dumps(options, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')

def parse_conditions(value, name):
    # Religious-subject-only cells are excluded with their Sharia-certificate rows.
    return table_conditions(value, name)

def public_vocational_conditions(value, name):
    result = []
    if not value: return result
    if 'ذكور' in value: result.append({'type': 'gender', 'value': 'male'})
    if '2003' in value: result.append({'type': 'birth_year', 'minimum': 2003})
    if 'بعد صدور' in value:
        result.append(exam('post-admission-assessment', 'اجتياز الفحص الطبي بعد صدور نتائج القبول.', 'Pass the medical assessment after admission.', True))
    elif re.search('اختبار|فحص|مقابلة', value):
        if 'اللغة' in value:
            if 'مقابلة' in value:
                label, en = 'اجتياز المقابلة التي تتضمن اختبار اللغة الأجنبية قبل تدوين الرغبة، وفق الإعلان رقم ١.', 'Pass the interview, including its foreign-language test, before applying under announcement 1.'
            else:
                label, en = 'اجتياز اختبار اللغة الأجنبية قبل تدوين الرغبة، وفق الإعلان رقم ١.', 'Pass the foreign-language test before applying under announcement 1.'
        elif 'الرسم' in value:
            label, en = 'اجتياز اختبار الرسم، واختبار الخط لمن يختار الخط العربي، وفق الإعلان رقم ١.', 'Pass drawing and, for Arabic calligraphy, the calligraphy test under announcement 1.'
        elif 'الموسيقية' in value:
            label, en = 'اجتياز اختبار التربية الموسيقية قبل تدوين الرغبة، وفق الإعلان رقم ١.', 'Pass the music education entrance assessment under announcement 1.'
        else:
            assert 'الفنون' in value, value
            label, en = 'اجتياز اختبار الفنون قبل تدوين الرغبة، وفق الإعلان رقم ١.', 'Pass the arts entrance assessment under announcement 1.'
        result.append(exam('entrance-'+stable_id(name), label, en))
    assert result, f'Unparsed vocational condition: {value}'
    return result

for branch in ['literary', 'vocational']:
    source = source_dir/f'{branch}-rows.json'
    rows = json.loads(source.read_text(encoding='utf-8'))
    for row in rows:
        for key, value in row.items():
            if isinstance(value, str) and key != 'sector': row[key] = clean(value)
    programs, excluded = [], []
    for row in rows:
        ident = f'{branch}-{row["sector"]}-{row["page"]:02}-{row["row"]:03}'
        name, place = row['name'], row['place']
        private = row['sector'] == 'private'
        if branch == 'vocational' and not private: name = vocational_program_name(name)
        reason = 'sharia_certificate' if 'ثانوية شرعية' in name else 'military_admission' if 'الدفاع' in row.get('institution', '') else None
        if reason:
            excluded.append({'id': ident, 'reason': reason})
            continue
        kind = 'institute' if re.search('معهد|مدرسة', name) else 'applied_college' if 'الكلية التطبيقية' in name else 'faculty'
        city = re.split(r'\s[/-]\s', place)[0]
        city = CITY_GOV.get(city, city)
        city = {'جرابلس': 'حلب', 'قامشلي': 'الحسكة', 'سلقين': 'إدلب', 'حارم': 'إدلب'}.get(city, city)
        assert city in GOVERNORATES, place
        gov, city_en = GOVERNORATES[city]
        if 'قامشلي' in place: gov, city_en, city = 'hasakah', 'Hasakah', 'الحسكة'
        if private:
            institution = {'id': 'private-'+stable_id(row['institution']), 'name': text(row['institution'])}
        elif row.get('institution', '').startswith('جامعة'):
            institution = {'id': 'public-'+stable_id(row['institution']), 'name': text(row['institution'])}
        else:
            institute = kind == 'institute'
            institution = {
                'id': f'public-{"institute" if institute else "university"}-{gov}',
                'name': text(('المعاهد الحكومية' if institute else 'الكليات الحكومية')+' — '+city,
                             ('Public institutes' if institute else 'Public university faculties')+' — '+city_en),
            }
        conditions, notes = [], []
        refs = [{'announcement': row['announcement'], 'page': row['page'], 'row': row['row']}]
        if 'إناث' in name: conditions.append({'type': 'gender', 'value': 'female'})
        if 'ذكور' in name: conditions.append({'type': 'gender', 'value': 'male'})
        if branch == 'literary' and regional_conditions(name):
            conditions += regional_conditions(name)
            refs.append({'announcement': 3, 'page': 4})
        if branch == 'vocational':
            category, specialty = qualification(row)
            allowed = [o['id'] for o in options if not category or (o['category'] == category and (not specialty or o['id'] == option_ids[(category, specialty)]))]
            assert allowed, row
            label = row['certificate'] + (' — '+row['profession'] if not private else '')
            label_en = option(category, specialty)['name']['en'] if category and specialty else 'Maritime transport vocational certificate' if category == 'maritime' else 'All vocational professions'
            conditions.append({'type': 'vocational_specialty', 'allowed': allowed, 'label': text(label, label_en)})
            if not private:
                conditions += public_vocational_conditions(row['conditions'], name)
                if row['conditions']: refs.append({'announcement': 6, 'page': 3})
                if not row['institution'].startswith('جامعة'):
                    notes.append(text('الجهة المشرفة: '+row['institution'], 'Supervising authority: '+row['institution']))
        if private and '+' in row['private']:
            conditions += parse_conditions(row['private'].split('+', 1)[1], name)
        channels = []
        for channel in (['private'] if private else ['general', 'parallel']):
            cell = row[channel]
            minimum = threshold(cell)
            if minimum == 'unavailable': continue
            extra = list(conditions)
            if branch == 'literary' and channel == 'general':
                extra.append({'type': 'no_previous_general_admission'})
            cell_condition = row.get(channel+'Condition', '')
            if cell.startswith('جميع المتقدم'): extra += parse_conditions(cell, name)
            if cell_condition and cell_condition != cell: extra += parse_conditions(cell_condition, name)
            extra = list({json.dumps(c, sort_keys=True, ensure_ascii=False): c for c in extra}.values())
            channels.append({'id': channel, 'minPercent': minimum, 'conditions': extra})
        assert channels, row
        if branch == 'literary' and not private and row['general'].startswith('جميع') and '%' in row['general']:
            notes.append(text('تجري المفاضلة على علامة المادة الاختصاصية، وليس على المجموع العام.', 'Ranking uses the specified subject mark rather than the overall total.'))
        if not private and kind in ['institute', 'applied_college']:
            notes.append(text('اللغة الأجنبية المعتمدة للدراسة هي الإنكليزية.', 'The designated foreign language of study is English.'))
        if branch == 'literary' and 'القانوني' in name and kind == 'institute':
            for ch in channels:
                ch['conditions'].append(exam('post-admission-legal', 'اجتياز اختبار المعهد القانوني بعد القبول، وفق الإعلان رقم ٣.', 'Pass the legal-institute assessment after admission under announcement 3.', True))
            refs.append({'announcement': 3, 'page': 2})
        campus = row.get('campus', place)
        programs.append({'id': ident, 'name': text(display_name(name), translations.get(name)), 'institution': institution,
            'campus': text(campus, city_en if campus == city else None), 'governorate': gov, 'field': program_field(name),
            'kind': kind, 'channels': channels, 'notes': notes, 'sources': refs})
    data = {**seed, 'version': '2026.1-'+branch+('.3' if branch == 'literary' else '.2'), 'coverage': branch,
            'scope': {**seed['scope'], 'branch': branch}, 'programs': programs}
    (OUT/f'{branch}.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8', newline='\n')
    manifest = {'version': data['version'], 'extractedRowsSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'extractedRows': len(rows), 'programCount': len(programs), 'excludedRows': excluded,
        'sourceRowsPerPage': dict(sorted(Counter(f'{r["sector"]}-{r["page"]:02}' for r in rows).items())),
        'channels': dict(Counter(c['id'] for p in programs for c in p['channels'])),
        'conditions': dict(Counter(c['type'] for p in programs for ch in p['channels'] for c in ch['conditions']))}
    (source_dir/f'{branch}-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8', newline='\n')
    print(branch, len(programs), 'excluded', len(excluded), 'channels', manifest['channels'])
