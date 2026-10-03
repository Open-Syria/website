"""Read Arabic PDF cells by glyph centre and resolve merged cells geometrically."""
import re
import unicodedata
import fitz


def table_rows(page):
    glyphs = []
    for block in page.get_text('rawdict')['blocks']:
        for line in block.get('lines', []):
            for span in line['spans']:
                for char in span['chars']:
                    x0, y0, x1, y1 = char['bbox']
                    glyphs.append(((x0+x1)/2, (y0+y1)/2, char['c']))
            glyphs.append((None, None, ' '))
    cache = {}
    def cell_text(rect):
        key = tuple(rect)
        if key not in cache:
            value = ''.join(c for x, y, c in glyphs if x is None or rect.x0 <= x < rect.x1 and rect.y0 <= y < rect.y1)
            value = unicodedata.normalize('NFKC', value)
            value = re.sub(r'[\u200b-\u200f\u202a-\u202e]', '', value)
            cache[key] = re.sub(r'\s+', ' ', value).strip()
        return cache[key]
    tables = page.find_tables().tables
    assert len(tables) == 1, (page.number+1, 'Unexpected table layout')
    table = tables[0]
    rectangles = [fitz.Rect(c) for c in table.cells]
    xs = sorted({round(v, 2) for c in rectangles for v in (c.x0, c.x1)})
    records = []
    for row_index, row in enumerate(table.rows):
        ys = [c for c in row.cells if c]
        y = (min(c[1] for c in ys) + min(c[3] for c in ys))/2
        cells = []
        for column, cell in enumerate(row.cells):
            if cell is None:
                x = (xs[column]+xs[column+1])/2
                matches = [c for c in rectangles if c.x0 < x < c.x1 and c.y0-0.05 <= y < c.y1]
                assert len(matches) == 1, (page.number+1, row_index, column)
                cell = matches[0]
            cells.append(cell_text(fitz.Rect(cell)))
        records.append((row_index+1, cells))
    return records
