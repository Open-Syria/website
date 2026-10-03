"""Extract PDF 11 table cells unchanged, including font-map artifacts for audit."""
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
source = next(s for s in sources if s['announcement'] == 11)
path = args.pdf_dir/source['filename']
assert hashlib.sha256(path.read_bytes()).hexdigest() == source['sha256'], 'Announcement 11 changed'
doc = fitz.open(path)
assert len(doc) == 24
fields = ['conditions', 'minimum', 'place', 'institution', 'name', 'profession', 'certificate']
rows = []
for index in range(3, 20):
    for row, cells in table_rows(doc[index]):
        assert len(cells) == 7, (index+1, row, cells)
        if row == 1: continue
        rows.append({'sector': 'public', 'announcement': 11, 'page': index+1,
                     'row': row, **dict(zip(fields, cells))})
assert len(rows) == 244
args.output_dir.mkdir(parents=True, exist_ok=True)
(args.output_dir/'foreign-vocational-rows.json').write_text(
    json.dumps(rows, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
print('foreign-vocational', len(rows), 'raw grid rows')
