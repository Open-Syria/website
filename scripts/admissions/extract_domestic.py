"""Extract pinned Syrian literary/vocational tables; retain all original cells for review."""
import argparse
import hashlib
import json
from pathlib import Path
import fitz
from pdf_tables import table_rows

parser = argparse.ArgumentParser()
parser.add_argument('--pdf-dir', type=Path, required=True)
parser.add_argument('--output-dir', type=Path, required=True)
args = parser.parse_args()
sources = json.loads((Path(__file__).parent/'2026-2027/source-catalogue.json').read_text(encoding='utf-8'))['sources']
for branch, specs in [
    ('literary', [('public', 4, range(7)), ('private', 7, range(32, 40))]),
    ('vocational', [('public', 6, range(4, 24)), ('private', 7, range(40, 63))]),
]:
    records = []
    for sector, announcement, pages in specs:
        source = next(s for s in sources if s['announcement'] == announcement)
        path = args.pdf_dir/source['filename']
        assert hashlib.sha256(path.read_bytes()).hexdigest() == source['sha256'], f'Source changed: {path.name}'
        doc = fitz.open(path)
        for index in pages:
            for row, cells in table_rows(doc[index]):
                record = {'sector': sector, 'announcement': announcement, 'page': index+1, 'row': row}
                if branch == 'literary' and sector == 'public':
                    assert len(cells) == 10
                    if 'اسم الكلية' in cells[-1]: continue
                    name, place, general, gc, parallel, pc = reversed(cells[-6:])
                    record.update(name=name, place=place, general=general, generalCondition=gc, parallel=parallel, parallelCondition=pc)
                elif branch == 'vocational' and sector == 'public':
                    assert len(cells) == 8
                    if row == 1: continue
                    certificate, profession, name, institution, place, general, parallel, conditions = reversed(cells)
                    record.update(certificate=certificate, profession=profession, name=name, institution=institution, place=place, general=general, parallel=parallel, conditions=conditions)
                else:
                    if row == 1: continue
                    assert len(cells) == (5 if branch == 'literary' else 6)
                    institution, place, campus, name, *tail = reversed(cells)
                    record.update(institution=institution, place=place, campus=campus, name=name, private=tail[-1])
                    if branch == 'vocational': record['certificate'] = tail[0]
                records.append(record)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir/f'{branch}-rows.json').write_text(json.dumps(records, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
    print(branch, len(records), 'public', sum(r['sector']=='public' for r in records))
