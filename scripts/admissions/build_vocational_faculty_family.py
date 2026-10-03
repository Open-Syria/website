"""Apply PDF 6 p4's faculty-family rules to its reviewed vocational mappings."""
import hashlib
import json
from collections import Counter
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).parent / '2026-2027'
OUT = ROOT / 'src/app/[locale]/admissions/_data/2026-2027'
base_path = OUT / 'vocational.json'
raw_path = SOURCE / 'vocational-rows.json'
rules_path = SOURCE / 'vocational-faculty-family-rules.json'
base = json.loads(base_path.read_text(encoding='utf-8'))
raw = json.loads(raw_path.read_text(encoding='utf-8'))
rules = json.loads(rules_path.read_text(encoding='utf-8'))
options = json.loads((OUT / 'vocational-options.json').read_text(encoding='utf-8'))
option_ids = {o['id'] for o in options}
public = {(r['announcement'], r['page'], r['row']): r for r in raw if r['sector'] == 'public'}
excluded = {(r['announcement'], r['page'], r['row']) for r in rules['excludedPublicRows']}
programs, used, groups = [], set(), Counter()
for original in base['programs']:
    if original['channels'][0]['id'] == 'private':
        continue
    assert [c['id'] for c in original['channels']] == ['general', 'parallel']
    source = original['sources'][0]
    coord = tuple(source[k] for k in ['announcement', 'page', 'row'])
    assert coord in public and coord not in excluded and coord not in used, coord
    candidates = [g for g in rules['thresholdGroups'] if source['page'] in g['pages'] and original['kind'] == g['kind']]
    assert len(candidates) == 1, coord
    group = candidates[0]
    # Use reviewed programme kinds/source pages, never a career-field heuristic.
    if group['id'] == 'engineering-faculties':
        assert original['name']['ar'].startswith('كلية الهندسة التقنية'), coord
    conditions = deepcopy(original['channels'][0]['conditions'])
    qualification = [c for c in conditions if c['type'] == 'vocational_specialty']
    assert len(qualification) == 1 and set(qualification[0]['allowed']) <= option_ids
    assert all(c['type'] in ['vocational_specialty', 'exam', 'gender', 'birth_year'] for c in conditions)
    conditions += [{'type': 'manual', 'label': label} for label in deepcopy(rules['verification'])]
    program = deepcopy(original)
    program['id'] = 'special-' + original['id']
    program['channels'] = [{'id': 'faculty_family', 'minPercent': group['minPercent'], 'conditions': conditions}]
    for reference in rules['sources']:
        if reference not in program['sources']:
            program['sources'].append(deepcopy(reference))
    programs.append(program)
    used.add(coord)
    groups[group['id']] += 1

assert used | excluded == set(public) and not used & excluded
assert groups == Counter({g['id']: g['expectedCount'] for g in rules['thresholdGroups']})
assert len(programs) == 291
key = 'special-vocational'
data = {**base, 'coverage': key, 'version': '2026.1-special-vocational.1', 'scope': rules['scope'], 'programs': programs}
(OUT / f'{key}.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
manifest = {
    'version': data['version'], 'scope': data['scope'], 'programCount': len(programs),
    'sourcePublicRowCount': len(public), 'privateRowsExcluded': sum(r['sector'] == 'private' for r in raw),
    'thresholdGroups': dict(groups), 'excludedPublicRows': rules['excludedPublicRows'],
    'dependencies': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in [base_path, raw_path, rules_path, OUT / 'vocational-options.json', SOURCE / 'source-catalogue.json']},
    'sourceReview': 'PDF 6 p4 establishes quota thresholds, exact specialty matching and vacant scientific-quota places; PDF 1 p11 establishes family eligibility. Reuses visually reviewed PDF 6 pp5-24 programme/qualification mappings and their conditions.',
    'boundaries': 'Syrian vocational certificates from 2026 only. No vocational disability, non-Syrian certificate or Arab/foreign quota is inferred. Family status, official choice availability and vacancies remain pending.',
}
(SOURCE / f'{key}-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
print(key, len(programs), dict(groups))
