"""Build 2025/2026 academic routes for Arab and foreign applicants (PDF 9)."""
import copy
import hashlib
import json
import re
from collections import Counter
from pathlib import Path
from catalogue import OUT, GOVERNORATES, CITY_GOV, seed, translations, text, stable_id, manual, exam, threshold
from domestic import program_field
from academic import clean_foreign

SOURCE_DIR = Path(__file__).parent/'2026-2027'

def entrance(name):
    if 'معمار' in name:
        return exam('architecture-exam', 'النجاح في اختبار العمارة قبل تدوين الرغبة (11 تشرين الأول 2026).',
                    'Pass the architecture entrance exam before listing this choice (11 October 2026).'), 5
    page = 5 if re.search('العلوم الصحية|الفنون الجميلة|التربية الرياضية', name) else 6 if 'للفنون التطبيقية' in name else 7 if 'للإعلام' in name else 6
    return exam('entrance-'+stable_id(name),
                'اجتياز اختبار القبول قبل تدوين الرغبة، وفق الشروط والمواعيد في الإعلان رقم ٩.',
                'Pass the entrance assessment before applying, following the conditions and dates in announcement 9.'), page


for branch, expected_public, expected_private in [('scientific', 618, 389), ('literary', 217, 131)]:
    key = 'foreign-'+branch
    source = SOURCE_DIR/f'{key}-rows.json'
    rows = json.loads(source.read_text(encoding='utf-8'))
    assert len(rows) == expected_public
    programs = []
    for original in rows:
        row = {k: clean_foreign(v) if isinstance(v, str) else v for k, v in original.items()}
        name, place, value = row['name'], row['place'], row['condition']
        kind = 'institute' if 'معهد' in name else 'applied_college' if 'الكلية التطبيقية' in name else 'faculty'
        if 'الجامعة التي' in place:
            gov, city_en, city = 'multiple', 'University selected by the applicant', place
            institution = {'id': 'public-medical-preparatory', 'name': text('السنة التحضيرية للكليات الطبية', 'Medical preparatory year')}
        else:
            city = re.split(r'\s[/-]\s', place)[0]
            city = CITY_GOV.get(city, city)
            if 'قامشلي' in place: city = 'الحسكة'
            assert city in GOVERNORATES, place
            gov, city_en = GOVERNORATES[city]
            institute = kind == 'institute'
            institution = {'id': f'public-{"institute" if institute else "university"}-{gov}',
                           'name': text(('المعاهد الحكومية' if institute else 'الكليات الحكومية')+' — '+city,
                                        ('Public institutes' if institute else 'Public university faculties')+' — '+city_en)}
        refs = [{'announcement': 9, 'page': row['page'], 'row': row['row']}]
        conditions, notes = [], []
        if 'إناث' in name: conditions.append({'type': 'gender', 'value': 'female'})
        if 'ذكور' in name: conditions.append({'type': 'gender', 'value': 'male'})
        # The ordinary 'محافظات' row has no reserved local-origin condition.
        if value:
            if value in ['اختبار بعد القبول', 'شريطة النجاح بالاختبار بعد القبول وأن يكون من مواليد2000 وما بعد']:
                conditions.append(exam('post-admission-assessment', 'اجتياز الفحص أو المقابلة بعد القبول، وفق الإعلان رقم ٩.',
                                       'Pass the assessment or interview after admission under announcement 9.', True))
                refs.append({'announcement': 9, 'page': 7})
                if '2000' in value: conditions.append({'type': 'birth_year', 'minimum': 2000})
            else:
                assert value in ['النجاح بالاختبار شرط لتدوين الرغبة', 'ي الاختبار شرط لتدوين الرغبة النجاح ف',
                                 'النجاح بالاختبارشرط لتدوين الرغبة', 'النجاح بالفحص شرط لتدوين الرغبة',
                                 'فحص طب ي ولياقة بدنية النجاح بالفحص شرط لتدوين الرغبة'], value
                condition, page = entrance(name)
                conditions.append(condition)
                refs.append({'announcement': 9, 'page': page})
        if 'للنفط والغاز' in name or 'للخطوط الحديدية' in name:
            notes.append(text('لا يلتزم الطلاب العرب والأجانب المقبولون في المعاهد الملتزمة بخدمة الدولة.',
                              'Arab and foreign students admitted to committed institutes have no state-employment obligation.'))
            refs.append({'announcement': 9, 'page': 3})
        if 'الدوام' in name:
            notes.append(text('مكان الدراسة: حمص، وفق الجدول الرسمي.', 'Classes are held in Homs, according to the official table.'))
        if 'المعهد التقاني' in name or gov == 'multiple':
            notes.append(text('اللغة الأجنبية المعتمدة للدراسة هي الإنكليزية.', 'The designated foreign language of study is English.'))
            refs.append({'announcement': 9, 'page': 2})
        if place == 'دير الزور / القامشلي':
            notes.append(text('يذكر المصدر دير الزور / القامشلي؛ يظهر هذا الخيار ضمن الحسكة بحسب موقع الدراسة المذكور.',
                              'The source lists Deir ez-Zor / Qamishli; this choice is grouped under Hasakah by its stated campus location.'))
        minimum = threshold(row['minimum'])
        assert minimum in [50, 60, 75, 80], row
        programs.append({'id': f'{key}-public-{row["page"]:02}-{row["row"]:03}',
                         'name': text(name, translations.get(name)), 'institution': institution,
                         'campus': text(place, city_en if place == city else None), 'governorate': gov,
                         'field': program_field(name), 'kind': kind,
                         'channels': [{'id': 'arab_foreign', 'minPercent': minimum, 'conditions': conditions}],
                         'notes': notes, 'sources': refs})
    # PDF 9 p2 refers to PDF 7; PDF 7 p5 expressly covers Arab/foreign
    # applicants with 2025/2026 academic certificates. Reuse reviewed rows,
    # preserving their thresholds, exams, source coordinates and campus names.
    domestic_path = OUT/f'{branch}.json'
    domestic = json.loads(domestic_path.read_text(encoding='utf-8'))
    private = [copy.deepcopy(p) for p in domestic['programs'] if p['channels'][0]['id'] == 'private']
    assert len(private) == expected_private
    for program in private:
        suffix = program['id'].removeprefix('literary-')
        program['id'] = key+'-'+suffix
        program['field'] = program_field(program['name']['ar'])
        for condition in program['channels'][0]['conditions']:
            assert condition['type'] == 'exam', condition
            condition['label']['en'] = condition['label']['en'].replace(' Dates: .', '')
        program['sources'] += [{'announcement': 9, 'page': 2}, {'announcement': 7, 'page': 5}]
    programs += private
    assert len({p['id'] for p in programs}) == len(programs)
    data = {**seed, 'version': '2026.1-'+key+'.1', 'coverage': key,
            'scope': {**seed['scope'], 'branch': branch, 'certificate': 'syrian_or_non_syrian',
                      'certificateYears': [2025, 2026], 'applicantCategory': 'arab_and_foreign'}, 'programs': programs}
    (OUT/f'{key}.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8', newline='\n')
    manifest = {'version': data['version'], 'extractedRowsSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                'privateCatalogueSha256': hashlib.sha256(domestic_path.read_bytes()).hexdigest(),
                'programCount': len(programs), 'publicCount': len(rows), 'privateCount': len(private),
                'rowsPerPage': dict(sorted(Counter(str(r['page']) for r in rows).items())),
                'channels': dict(Counter(c['id'] for p in programs for c in p['channels'])),
                'conditions': dict(Counter(c['type'] for p in programs for ch in p['channels'] for c in ch['conditions'])),
                'excludedSections': [{'announcement': 9, 'page': 2, 'reason': 'older_certificates_private_route'},
                                     {'announcement': 9, 'page': 3, 'reason': 'direct_language_registration'}]}
    (SOURCE_DIR/f'{key}-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8', newline='\n')
    print(key, len(programs), manifest['channels'], manifest['conditions'])
