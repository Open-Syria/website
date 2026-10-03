"""Build the Syrian Sharia route from PDF 4 and PDF 7 Table 2.

Run extract_domestic.py and build_domestic.py first. The complete 415-row
literary extraction already includes the dedicated Sharia rows. Reuse its
reviewed shared choices without changing the literary catalogue.
"""
import hashlib
import json
from collections import Counter
from copy import deepcopy
from pathlib import Path

from catalogue import OUT, text, threshold
from domestic import clean

SOURCE_DIR = Path(__file__).parent / '2026-2027'
row_path = SOURCE_DIR / 'literary-rows.json'
literary_path = OUT / 'literary.json'
rows = json.loads(row_path.read_text(encoding='utf-8'))
literary = json.loads(literary_path.read_text(encoding='utf-8'))
shared = {p['id']: p for p in literary['programs']}

# PDF 4 p5 rows 22–40 and the following 19 certificate-specific rows describe
# the same faculties in the same order, with different score/subject rules.
dedicated = [(5, r) for r in range(41, 48)] + [(6, r) for r in range(3, 15)]
counterparts = {coord: 22 + i for i, coord in enumerate(dedicated)}
english = [
    'Sharia (Quran and Hadith)',
    'Sharia (Islamic jurisprudence and its principles)',
    'Sharia (Sharia and law)',
    'Sharia (Islamic economics and banking)',
    'Sharia (creed, Islamic philosophy and religions)',
    'Sharia (Islamic education)',
    'Sharia (Islamic jurisprudence and its principles)',
    'Sharia (Sharia and law)',
    'Sharia (Quran and Hadith)',
    'Sharia (Islamic jurisprudence and its principles)',
    'Sharia (Quran and Hadith)',
    'Sharia (Islamic jurisprudence and its principles)',
    'Sharia (Islamic jurisprudence and its principles) — eastern-governorate quota',
    'Sharia (Islamic jurisprudence and its principles) — other-governorate quota',
    'Sharia (Islamic jurisprudence and its principles)',
    'Sharia (Quran and Hadith)',
    'Sharia (Sharia and law)',
    'Second Sharia Faculty (Islamic jurisprudence and its principles)',
    'Second Sharia Faculty (Quran and Hadith)',
]
programs, excluded = [], []
for raw in rows:
    row = {k: clean(v) if isinstance(v, str) and k != 'sector' else v for k, v in raw.items()}
    coord = (row['page'], row['row'])
    old_id = f'literary-{row["sector"]}-{row["page"]:02}-{row["row"]:03}'
    ident = old_id.replace('literary-', 'sharia-', 1)
    private = row['sector'] == 'private'
    reason = None
    if not private and row['page'] == 5 and 22 <= row['row'] <= 40:
        reason = 'replaced_by_sharia_certificate_row'
    if not private and row['name'] == 'المعهد المتوسط للعلوم الشرعية والعربية':
        reason = 'direct_institute_registration_pdf3_p4'
    if reason:
        excluded.append({'id': ident, 'reason': reason})
        continue
    if not private and coord in counterparts:
        assert 'ثانوية شرعية' in row['name'], row
        program = deepcopy(shared[f'literary-public-05-{counterparts[coord]:03}'])
        assert program['campus']['ar'] == row['place'], row
        program['name'] = text(row['name'], english[dedicated.index(coord)] + ' — Sharia certificate')
        # Keep identity/location/quota details; do not inherit the literary
        # faculty rows' 60% religion and Arabic requirements.
        for channel in program['channels']:
            channel['minPercent'] = threshold(row[channel['id']])
            assert channel['minPercent'] == (55 if channel['id'] == 'general' else 50)
            channel['conditions'] = [c for c in channel['conditions'] if c['type'] != 'subject']
            channel['scoreBasis'] = 'sharia_subjects_included'
        program['sources'] = [{'announcement': 4, 'page': row['page'], 'row': row['row']}]
        # The merged score-basis cell starts on p5; p6 continues it without text.
        if row['page'] == 6:
            program['sources'].append({'announcement': 4, 'page': 5})
    else:
        assert 'ثانوية شرعية' not in row['name'], row
        program = deepcopy(shared[old_id])
    program['id'] = ident
    for ref in [{'announcement': 3, 'page': 1}, {'announcement': 3, 'page': 2}]:
        if ref not in program['sources']:
            program['sources'].append(ref)
    if private:
        program['sources'].append({'announcement': 7, 'page': 4})
    elif {'announcement': 3, 'page': 4} not in program['sources']:
        program['sources'].append({'announcement': 3, 'page': 4})
    programs.append(program)

assert len(rows) == 415 and len(programs) == 373
assert Counter(r['reason'] for r in excluded) == {
    'replaced_by_sharia_certificate_row': 19,
    'direct_institute_registration_pdf3_p4': 23,
}
assert sum(any(c.get('scoreBasis') for c in p['channels']) for p in programs) == 19
data = {**literary, 'version': '2026.1-sharia.2', 'coverage': 'sharia',
        'scope': {**literary['scope'], 'branch': 'sharia'}, 'programs': programs}
(OUT / 'sharia.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
manifest = {
    'version': data['version'],
    'extractedRowsFile': 'literary-rows.json',
    'extractedRowsSha256': hashlib.sha256(row_path.read_bytes()).hexdigest(),
    'literaryCatalogueSha256': hashlib.sha256(literary_path.read_bytes()).hexdigest(),
    'extractedRows': len(rows), 'programCount': len(programs),
    'excludedRows': excluded,
    'dedicatedShariaRows': [{'page': p, 'row': r} for p, r in dedicated],
    'sourceRowsPerPage': dict(sorted(Counter(f'{r["sector"]}-{r["page"]:02}' for r in rows).items())),
    'channels': dict(Counter(c['id'] for p in programs for c in p['channels'])),
    'conditions': dict(Counter(c['type'] for p in programs for ch in p['channels'] for c in ch['conditions'])),
    'scoreBasis': 'Standard choices: PDF 3 p2 religious subjects averaged as one course. Dedicated Sharia choices: PDF 4 p5 after adding religious-subject marks, continued on p6. Enter the official percentages separately; no unpublished formula is inferred.',
}
(SOURCE_DIR / 'sharia-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8', newline='\n')
print('sharia', len(programs), 'excluded', len(excluded), 'channels', manifest['channels'])
