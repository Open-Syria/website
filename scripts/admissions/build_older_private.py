"""Build older-certificate private routes from PDF 7's already reviewed tables.

PDF 7 pp4–6: Syrian/equivalent applicants, 2025 and earlier.
PDF 7 pp5–7: Arab/foreign applicants, 2024 and earlier.
Both accept Syrian and officially equivalent non-Syrian certificates.
"""
import hashlib
import json
from collections import Counter
from copy import deepcopy
from pathlib import Path

from catalogue import OUT

source_dir = Path(__file__).parent / '2026-2027'
for foreign in [False, True]:
    for branch, count in [('scientific', 389), ('literary', 131), ('vocational', 536)]:
        key = f'older-{"foreign-" if foreign else ""}{branch}'
        base_path = OUT / f'{branch}.json'
        base = json.loads(base_path.read_text(encoding='utf-8'))
        row_path = source_dir / ('rows.json' if branch == 'scientific' else f'{branch}-rows.json')
        raw = json.loads(row_path.read_text(encoding='utf-8'))
        private_rows = [r for r in raw if r['sector'] == 'private']
        programs = deepcopy([p for p in base['programs'] if p['channels'][0]['id'] == 'private'])
        assert len(programs) == len(private_rows) == count
        pages = [5, 7] if foreign else [4, 5, 6]
        for p in programs:
            ref = p['sources'][0]
            assert ref['announcement'] == 7
            p['id'] = f'{key}-private-{ref["page"]:02}-{ref["row"]:03}'
            assert [c['id'] for c in p['channels']] == ['private']
            assert all(c['type'] in ['exam', 'vocational_specialty'] for c in p['channels'][0]['conditions'])
            for page in [1, *pages]:
                ref = {'announcement': 7, 'page': page}
                if ref not in p['sources']:
                    p['sources'].append(ref)
        data = {**base, 'coverage': key, 'version': f'2026.1-{key}.1',
                'scope': {'branch': branch, 'certificateYear': 2026,
                          'certificate': 'syrian_or_non_syrian',
                          'certificateYearMaximum': 2024 if foreign else 2025,
                          'applicantCategory': 'arab_and_foreign' if foreign else 'syrian_or_equivalent'},
                'programs': programs}
        (OUT / f'{key}.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8', newline='\n')
        manifest = {
            'version': data['version'], 'scope': data['scope'],
            'prerequisiteCatalogue': f'{branch}.json',
            'prerequisiteCatalogueSha256': hashlib.sha256(base_path.read_bytes()).hexdigest(),
            'extractedRowsFile': row_path.name,
            'extractedRowsSha256': hashlib.sha256(row_path.read_bytes()).hexdigest(),
            'privateRows': len(private_rows), 'programCount': len(programs),
            'sourceRowsPerPage': dict(sorted(Counter(str(r['page']) for r in private_rows).items())),
            'conditions': dict(Counter(c['type'] for p in programs for c in p['channels'][0]['conditions'])),
            'scopeReferences': [{'announcement': 7, 'page': p} for p in pages],
            'score': 'Use the official admission percentage for the certificate year; do not infer a historical denominator from 2026 totals. Vocational qualifications and all entrance tests remain required.',
            'excluded': ['Public admission', 'Transfer/change-of-admission processes (PDF 7 p2)', 'Older Sharia certificates: the reviewed equivalence rule is explicitly scoped to 2026 in PDF 3'],
        }
        (source_dir / f'{key}-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8', newline='\n')
        print(key, count, 'private choices; maximum certificate year', data['scope']['certificateYearMaximum'])
