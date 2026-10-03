"""Build the scientific catalogue from its pinned, geometrically extracted source rows."""
import json
import re
import hashlib
from pathlib import Path
from collections import Counter
from normalize import normalize
from catalogue import OUT, SOURCE, GOVERNORATES, CITY_GOV, seed, translations, text, display_name, stable_id, field_for, base_conditions, threshold, table_conditions

rows = json.loads(SOURCE.read_text(encoding='utf-8'))
for row in rows:
    for key, value in row.items():
        if isinstance(value, str) and key != 'sector':
            row[key] = normalize(value)

programs = []
for row in rows:
    name, place = row['name'], row['place']
    is_private = row['sector'] == 'private'
    kind = 'institute' if re.search('معهد|مدرسة التمريض', name) else 'applied_college' if 'التطبيقية' in name and 'الكلية' in name else 'faculty'
    if 'الجامعة التي' in place:
        gov, city_en, city = 'multiple', 'University selected by the applicant', place
    else:
        city = place.split(' / ')[0]
        city = CITY_GOV.get(city, city)
        assert city in GOVERNORATES, place
        gov, city_en = GOVERNORATES[city]
        # The table places this entry under Deir ez-Zor but explicitly locates it in Qamishli.
        if 'القامشلي' in place or 'قامشلي' in place:
            gov, city_en, city = 'hasakah', 'Hasakah', 'الحسكة'
    if is_private:
        institution = {'id': 'private-'+stable_id(row['institution']), 'name': text(row['institution'])}
    elif gov == 'multiple':
        institution = {'id': 'public-medical-preparatory', 'name': text('السنة التحضيرية للكليات الطبية', 'Medical preparatory year')}
    else:
        label = 'المعاهد الحكومية' if kind == 'institute' else 'الكليات الحكومية'
        label_en = 'Public institutes' if kind == 'institute' else 'Public university faculties'
        institution = {'id': f'public-{kind if kind == "institute" else "university"}-{gov}',
                       'name': text(label+' — '+city, label_en+' — '+city_en)}
    conditions, refs = base_conditions(row)
    channels = []
    notes = []
    for channel in (['private'] if is_private else ['general', 'parallel']):
        value = row[channel]
        minimum = threshold(value)
        if minimum == 'unavailable': continue
        channel_conditions = list(conditions)
        if channel == 'general': channel_conditions.append({'type': 'no_previous_general_admission'})
        cell_condition = row.get(channel+'Condition', '')
        if value.startswith('جميع المتقدم'): channel_conditions += table_conditions(value, name)
        if cell_condition and cell_condition != value: channel_conditions += table_conditions(cell_condition, name)
        if 'الدوام' in cell_condition:
            notes.append(text('مكان الدراسة: حمص، وفق الجدول الرسمي.', 'Classes are held in Homs, according to the official table.'))
        channel_conditions = list({json.dumps(c, sort_keys=True, ensure_ascii=False): c for c in channel_conditions}.values())
        channels.append({'id': channel, 'minPercent': minimum, 'conditions': channel_conditions})
    assert channels, row
    if re.search('تخصصي|اللغة العربية|اللغة الإنكليزية|اللغة الفرنسية|اللغة الروسية', name) and not is_private:
        # Only the explicit subject-ranked choices, never similarly named institutes.
        if 'تخصصي' in name or (row['general'].startswith('جميع') and '%' in row['general']):
            notes.append(text('تجري المفاضلة على علامة المادة الاختصاصية، وليس على المجموع العام.',
                              'Ranking uses the specified subject mark, not the overall total.'))
    if kind in ['institute', 'applied_college'] and not is_private:
        notes.append(text('اللغة الأجنبية المعتمدة للدراسة هي الإنكليزية.', 'The designated foreign language of study is English.'))
        refs.append({'announcement': 5, 'page': 13})
    if any(c['type'] == 'birth_year' and c['minimum'] == 2003 for ch in channels for c in ch['conditions']):
        refs.append({'announcement': 5, 'page': 12})
    refs.insert(0, {'announcement': 7 if is_private else 2, 'page': row['page'], 'row': row['row']})
    campus = row.get('campus', place)
    programs.append({
        'id': f'{row["sector"]}-{row["page"]:02}-{row["row"]:03}',
        'name': text(display_name(name), translations.get(name)), 'institution': institution,
        'campus': text(campus, city_en if campus == city else None),
        'governorate': gov, 'field': field_for(name), 'kind': kind,
        'channels': channels, 'notes': list({n['ar']: n for n in notes}.values()), 'sources': refs,
    })

assert len(programs) == 1169
assert len({p['id'] for p in programs}) == len(programs)
data = {**seed, 'version': '2026.1-scientific.2', 'coverage': 'scientific', 'programs': programs}
(OUT / 'scientific.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8', newline='\n')
manifest = {
    'version': data['version'], 'extractedRowsSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'programCount': len(programs), 'publicCount': 780, 'privateCount': 389,
    'rowsPerPage': dict(sorted(Counter(f'{r["sector"]}-{r["page"]:02}' for r in rows).items())),
    'channels': dict(Counter(c['id'] for p in programs for c in p['channels'])),
    'conditions': dict(Counter(c['type'] for p in programs for ch in p['channels'] for c in ch['conditions'])),
}
(Path(__file__).parent/'2026-2027/manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8', newline='\n')
print(json.dumps(manifest, indent=2))
