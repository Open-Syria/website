"""Extract the pinned 2026 scientific tables with PyMuPDF 1.27.2.2.

python scripts/admissions/extract.py --pdf-dir PATH --output PATH/rows.json
Optional --render-dir PATH writes a PNG for each table page for visual review.
Do not use extracted glyph text directly in the UI; build.py normalizes and validates it.
"""
import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path
import fitz
from pdf_tables import table_rows

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--pdf-dir', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--render-dir', type=Path)
args = parser.parse_args()
catalogue = json.loads((Path(__file__).parent/'2026-2027/source-catalogue.json').read_text(encoding='utf-8'))
sources = {s['announcement']: s for s in catalogue['sources']}
records = []
for sector, announcement, pages in [('public', 2, range(20)), ('private', 7, range(9, 32))]:
    source = sources[announcement]
    path = args.pdf_dir/source['filename']
    assert hashlib.sha256(path.read_bytes()).hexdigest() == source['sha256'], f'Source changed: {path.name}; review before importing.'
    document = fitz.open(path)
    for page_index in pages:
        page = document[page_index]
        for row_index, cells in table_rows(page):
            record = {'sector': sector, 'page': page_index+1, 'row': row_index}
            if sector == 'public':
                if 'اسم الكلية' in cells[-1]: continue
                if len(cells) == 10:
                    name, place, general, gc, parallel, pc = reversed(cells[-6:])
                else:
                    assert len(cells) == 8 and page_index == 10
                    name, place, general, parallel = reversed(cells[-4:])
                    gc = pc = ''
                record.update(name=name, place=place, general=general, generalCondition=gc, parallel=parallel, parallelCondition=pc)
            else:
                if 'اسم الجامعة' in cells[-1]: continue
                assert len(cells) == 5
                record.update(institution=cells[4], place=cells[3], campus=cells[2], name=cells[1], private=cells[0])
            records.append(record)
        if args.render_dir:
            args.render_dir.mkdir(parents=True, exist_ok=True)
            page.get_pixmap(matrix=fitz.Matrix(1.8, 1.8)).save(args.render_dir/f'{sector}-{page_index+1:02}.png')
        print(f'{sector}: PDF page {page_index+1}', flush=True)
assert len(records) == 1169
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(records, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
print(f'Extracted {len(records)} source rows to {args.output}')
