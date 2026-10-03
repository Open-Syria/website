"""Extract both special-quota columns from the pinned Syrian academic tables."""
import argparse
import hashlib
import json
from pathlib import Path
import fitz
from pdf_tables import table_rows

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--pdf-dir', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
sources = json.loads((Path(__file__).parent/'2026-2027/source-catalogue.json').read_text(encoding='utf-8'))['sources']
records = []
for branch, announcement, count in [('scientific', 2, 20), ('literary', 4, 7)]:
    source = next(s for s in sources if s['announcement'] == announcement)
    path = args.pdf_dir/source['filename']
    assert hashlib.sha256(path.read_bytes()).hexdigest() == source['sha256'], path.name
    doc = fitz.open(path)
    for index in range(count):
        for row, cells in table_rows(doc[index]):
            if 'اسم الكلية' in cells[-1]: continue
            assert len(cells) == 10 or (announcement == 2 and index == 10 and len(cells) == 8)
            disability_condition, disability, family_condition, family = cells[:4]
            records.append({'branch': branch, 'announcement': announcement, 'page': index+1, 'row': row,
                            'name': cells[-1], 'place': cells[-2],
                            'facultyFamily': family, 'facultyFamilyCondition': family_condition,
                            'disability': disability, 'disabilityCondition': disability_condition})
    print(branch, sum(r['branch'] == branch for r in records))
assert len(records) == 1064
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(records, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
