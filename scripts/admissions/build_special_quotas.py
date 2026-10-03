"""Build Syrian 2026 faculty-family/disability routes from reviewed PDF 2/4 columns."""
import hashlib
import json
import re
from collections import Counter
from copy import deepcopy
from pathlib import Path
from catalogue import OUT, manual, text, table_conditions, threshold
from domestic import clean

source_dir = Path(__file__).parent/'2026-2027'
raw_path = source_dir/'special-quota-rows.json'
correction_path = source_dir/'special-quota-corrections.json'
rows = json.loads(raw_path.read_text(encoding='utf-8'))
by_coord = {(r['branch'],r['page'],r['row']):r for r in rows}
corrections = json.loads(correction_path.read_text(encoding='utf-8'))
seen = set()
for fix in corrections:
    coord = (fix['branch'],fix['page'],fix['row'])
    key = (*coord,fix['field'])
    assert key not in seen, key
    seen.add(key)
    assert by_coord[coord][fix['field']] == fix['original'], key
    by_coord[coord][fix['field']] = fix['replacement']
for r in rows:
    for k in ['name','place','facultyFamily','facultyFamilyCondition','disability','disabilityCondition']:
        r[k] = clean(r[k])

def unique(values):
    return list({json.dumps(v,sort_keys=True,ensure_ascii=False):v for v in values}.values())

def medical_condition(value):
    if not value:
        return manual('لم يحدد صف الجدول نوع الإعاقة لهذه الرغبة. يلزم تأكيد الوزارة واللجنة الطبية لأهلية التقدم إليها.',
                      'This table row does not specify a disability type. Obtain Ministry and medical-committee confirmation that this choice is available for your case.')
    value = value.replace('برصية','بصرية')
    parts, arabic_parts = [], []
    for ar,en in [('سمعية','hearing'),('بصرية','visual')]:
        match = re.search(ar+r'([^سحب]*)',value)
        if match:
            # Stop before the next disability type, not before arbitrary Arabic letters.
            segment = re.split('سمعية|بصرية|حركية',value[value.index(ar)+len(ar):])[0]
            limit = re.search(r'(\d+)\s*[%٪]',segment)
            parts.append(f'{en} disability'+(f' at most {limit[1]}%' if limit else ' of any degree'))
            arabic_parts.append(ar+(f' لا تزيد عن {limit[1]}%' if limit else ' مهما كانت درجتها'))
    if 'حركية' in value:
        if 'علوية' in value:
            lower = 'with one functional limb' if re.search(r'سفلية بطرف',value) else 'of any degree'
            parts.append('upper-limb motor disability with one functional limb, lower-limb motor disability '+lower+', or combined upper/lower-limb motor disability with one functional limb (any degree)')
            arabic_parts.append('حركية علوية بطرف واحد وظيفي، أو حركية سفلية'+(' بطرف واحد وظيفي' if lower=='with one functional limb' else '')+'، أو حركية سفلية وعلوية بطرف واحد وظيفي، مهما كانت الدرجة')
        elif 'سفلية' in value:
            parts.append('lower-limb motor disability of any degree')
            arabic_parts.append('حركية سفلية مهما كانت درجتها')
        else:
            parts.append('motor disability of any degree')
            arabic_parts.append('حركية مهما كانت درجتها')
    assert parts, value
    return manual('يلزم اعتماد اللجنة الطبية لنوع الإعاقة ونسبتها ولمناسبة الرغبة لحالتك: '+'، أو '.join(arabic_parts)+'.',
                  'The official medical committee must approve the disability type, degree and suitability of this choice: '+'; or '.join(parts)+'.')

for branch in ['scientific','literary','sharia']:
    base_path = OUT/f'{branch}.json'
    base = json.loads(base_path.read_text(encoding='utf-8'))
    raw_branch = 'literary' if branch=='sharia' else branch
    relevant = [r for r in rows if r['branch']==raw_branch]
    base_programs = {(p['sources'][0]['page'],p['sources'][0]['row']):p for p in base['programs'] if p['channels'][0]['id']=='general'}
    programs, excluded = [], []
    for r in relevant:
        coord = (r['page'],r['row'])
        p = base_programs.get(coord)
        if not p:
            excluded.append({'page':r['page'],'row':r['row'],'reason':'Not in the matching certificate route (dedicated Sharia rows or direct-registration institutes).'})
            continue
        general = p['channels'][0]
        identity = [c for c in general['conditions'] if c['type'] in ['gender','birth_year','governorate','manual','no_previous_general_admission']]
        channels = []
        family = r['facultyFamily']
        if family:
            minimum = 50 if family.startswith('50 ') else threshold(family)
            assert minimum != 'unavailable', r
            condition_text = r['facultyFamilyCondition']
            conditions = deepcopy(identity)
            if condition_text: conditions += table_conditions(condition_text,p['name']['ar'])
            if 'المتقدمات' in family: conditions += table_conditions(family,p['name']['ar'])
            if not any(c['type']=='exam' and c['stage']=='after_admission' for c in conditions):
                conditions += [deepcopy(c) for c in general['conditions'] if c['type']=='exam' and c['stage']=='after_admission']
            # Table 4's Sharia faculty family column deliberately omits the ordinary subject requirements.
            assert not ('الشريعة' in p['name']['ar'] and any(c['type']=='subject' for c in conditions)), r
            conditions.append(manual('يلزم إثبات صفة ابن أو ابنة عضو هيئة تدريس مؤهل بالبيانات المعتمدة من مديرية شؤون العاملين في الجامعة أو المعهد العالي، واستيفاء أحكام هذه الحصة.',
                'The university or higher institute personnel directorate must verify that you are the child of an eligible faculty member and that the quota rules apply.'))
            if branch=='scientific':
                conditions.append(manual('تتحقق الوزارة من شرط عدم احتساب من يحقق حد القبول العام النهائي ضمن العدد المخصص للحصة. الحدود المعروضة هنا للتقدم وليست حدود القبول النهائية.',
                    'The Ministry must check the rule excluding applicants who meet the final general-admission cutoff from the quota allocation. The displayed figures are application minimums, not final acceptance cutoffs.'))
            channels.append({'id':'faculty_family','minPercent':minimum,'conditions':unique(conditions)})
        disability = r['disability']
        if disability not in ['', '-', '_']:
            conditions = deepcopy(identity)
            # Academic requirements come from this column, never from the ordinary general track.
            minimum = None
            subject_text = disability
            if disability.startswith('75%'):
                minimum = 75
                subject_text = ''
            elif disability.startswith('50'):
                minimum = 50
                subject_text = re.sub(r'^50\s*%?\s*(?:درجة)?','',disability).strip()
            if subject_text:
                conditions += table_conditions(subject_text,p['name']['ar'])
            # Entrance tests still apply; the source repeats them in either quota column.
            conditions += [deepcopy(c) for c in general['conditions'] if c['type']=='exam']
            conditions.append(medical_condition(r['disabilityCondition']))
            if 'برمجيات' in disability:
                conditions.append(manual('هذا الخيار في حصة ذوي الإعاقة لاختصاص البرمجيات فقط؛ يلزم تأكيد الاختصاص عند التسجيل.',
                    'This disability-quota choice is restricted to the software specialisation; confirm the specialisation when registering.'))
            if 'اتصالات فقط' in disability:
                conditions.append(manual('هذا الخيار في حصة ذوي الإعاقة لاختصاص الاتصالات فقط؛ يلزم تأكيد الاختصاص عند التسجيل.',
                    'This disability-quota choice is restricted to telecommunications; confirm the specialisation when registering.'))
            channels.append({'id':'disability','minPercent':minimum,'conditions':unique(conditions)})
        if not channels:
            excluded.append({'page':r['page'],'row':r['row'],'reason':'Neither special quota is offered in the source columns.'})
            continue
        # A display-name repair must not change the identity of an existing exam.
        # Reuse the ordinary route's ID only when its stage and full label match.
        for channel in channels:
            for condition in channel['conditions']:
                if condition['type'] == 'exam':
                    for original in general['conditions']:
                        if original['type'] == 'exam' and original['stage'] == condition['stage'] and original['label'] == condition['label']:
                            condition['id'] = original['id']
                            break
        program = deepcopy(p)
        program['id'] = f'special-{branch}-public-{r["page"]:02}-{r["row"]:03}'
        program['channels'] = channels
        # These routes rank by the overall comparison score, including faculty-family language rows.
        program['notes'] = [n for n in program['notes'] if 'Ranking uses' not in n['en'] and 'Ranking is' not in n['en']]
        ann = 1 if branch=='scientific' else 3
        pages = [11,12,13,14,15,16] if ann==1 else [8,9,10,11]
        program['sources'] = unique(program['sources']+[{'announcement':ann,'page':page} for page in pages])
        programs.append(program)
    key = f'special-{branch}'
    data = {**base,'version':f'2026.1-{key}.2','coverage':key,
            'scope':{**base['scope'],'admissionRoute':'special_quotas'},'programs':programs}
    (OUT/f'{key}.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8',newline='\n')
    manifest = {'version':data['version'],'scope':data['scope'],'programCount':len(programs),
        'sourceRowCount':len(relevant),'channels':dict(Counter(c['id'] for p in programs for c in p['channels'])),
        'prerequisiteCatalogue':base_path.name,'prerequisiteCatalogueSha256':hashlib.sha256(base_path.read_bytes()).hexdigest(),
        'extractedRowsSha256':hashlib.sha256(raw_path.read_bytes()).hexdigest(),
        'correctionsSha256':hashlib.sha256(correction_path.read_bytes()).hexdigest(),
        'reviewedCellCorrections':len(corrections),'excluded':excluded,
        'manualVerification':'Personnel-directorate eligibility for faculty families; official medical committee approval for disability type/degree and chosen specialty. No ranking bonus is applied to application minima.',
        'vocational':'Faculty-family vocational applicants follow their vocational announcement and vacant places in matching specialties; no unsupported lowered threshold is inferred.'}
    (source_dir/f'{key}-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    print(key,len(programs),manifest['channels'])
