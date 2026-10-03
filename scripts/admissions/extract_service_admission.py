"""Preserve the defence/security table cells from the hash-pinned PDFs."""
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
args = parser.parse_args()
sources = json.loads((Path(__file__).parent/'2026-2027/source-catalogue.json').read_text(encoding='utf-8'))['sources']
records = []
for ann, pages in [(2,[21]),(4,[8]),(8,[32,40]),(6,[11]),(10,[6])]:
    source = next(s for s in sources if s['announcement']==ann)
    path = args.pdf_dir/source['filename']
    assert hashlib.sha256(path.read_bytes()).hexdigest()==source['sha256']
    doc = fitz.open(path)
    for number in pages:
        page = doc[number-1]
        if ann in [6,10]:
            for row,cells in table_rows(page)[:3]:
                if row==1: continue
                records.append({'announcement':ann,'page':number,'table':1,'row':row,'route':'defence','cells':cells})
            continue
        glyphs = [(c['bbox'],c['c']) for b in page.get_text('rawdict')['blocks'] for line in b.get('lines',[]) for span in line['spans'] for c in span['chars']]
        def cell_text(rect):
            value = ''.join(c for box,c in glyphs if rect.x0 <= (box[0]+box[2])/2 < rect.x1 and rect.y0 <= (box[1]+box[3])/2 < rect.y1)
            return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',value)).strip()
        tables = sorted(page.find_tables().tables,key=lambda t:t.bbox[1])
        assert len(tables)==2, (ann,number,len(tables))
        for ti,table in enumerate(tables,1):
            rects = [fitz.Rect(c) for c in table.cells]
            xs = sorted({round(x,2) for c in rects for x in [c.x0,c.x1]})
            assert len(xs)==5
            for ri,row in enumerate(table.rows,1):
                # A merged condition cell spans the whole table; use the shortest
                # row cell to locate this grid row, not the merged bounding box.
                present = [c for c in row.cells if c]
                y = (min(c[1] for c in present)+min(c[3] for c in present))/2
                cells = []
                for left,right in zip(xs,xs[1:]):
                    x = (left+right)/2
                    matches = [c for c in rects if c.x0<=x<c.x1 and c.y0<=y<c.y1]
                    assert len(matches)==1,(ann,number,ti,ri)
                    cells.append(cell_text(matches[0]))
                # Only actual programme rows have a numeric minimum in column 3.
                if not re.fullmatch(r'\d+(?:%)?',cells[2]): continue
                records.append({'announcement':ann,'page':number,'table':ti,'row':ri,'route':'defence' if ti==1 else 'security','cells':cells})
assert len(records)==58, len(records)
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print('Extracted',len(records),'service-admission source rows')
