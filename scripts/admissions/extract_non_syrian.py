"""Extract announcement 8 ordinary parallel tables, retaining the original cells."""
import argparse
import hashlib
import json
from pathlib import Path
import fitz
from pdf_tables import table_rows

parser = argparse.ArgumentParser()
parser.add_argument('--pdf-dir', type=Path, required=True)
parser.add_argument('--output-dir', type=Path, default=Path(__file__).parent/'2026-2027')
args = parser.parse_args()
sources = json.loads((Path(__file__).parent/'2026-2027/source-catalogue.json').read_text(encoding='utf-8'))['sources']
source = next(s for s in sources if s['announcement'] == 8)
path = args.pdf_dir/source['filename']
assert hashlib.sha256(path.read_bytes()).hexdigest() == source['sha256'], 'Announcement 8 changed'
doc = fitz.open(path)
assert len(doc) == 40
for branch, pages in [('scientific', range(13, 31)), ('literary', range(32, 39))]:
    rows = []
    for index in pages:
        for row, cells in table_rows(doc[index]):
            assert len(cells) == 4, (index+1, row, cells)
            # The first scientific page has an additional title row.
            if row <= (3 if index == 13 else 2): continue
            condition, minimum, place, name = cells
            assert '%' in minimum, (index+1, row, cells)
            rows.append({'announcement': 8, 'page': index+1, 'row': row,
                         'name': name, 'place': place, 'parallel': minimum, 'condition': condition})
    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir/f'non-syrian-{branch}-rows.json').write_text(
        json.dumps(rows, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
    print(branch, len(rows))
