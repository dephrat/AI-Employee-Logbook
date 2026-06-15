"""
Logbook Flask server
Receives staged donation forms from the app and appends to XLSX.

File structure: one file per year (e.g. "2026 IN.xlsx")
                one tab per month (e.g. "JUN")

POST /append
  Body: { "forms": [...], "month": "JUN", "year": "2026" }
  Response: { "ok": true, "rows_added": N }
             { "ok": false, "error": "..." }
"""

from flask import Flask, request, jsonify
from openpyxl import load_workbook, Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
import os
import datetime

app = Flask(__name__)

# Directory where XLSX files live
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

# Column definitions — must match the app's field schema
COLUMNS = [
    ('Date',            'date'),
    ('Source',          'donor'),
    ('Non-Perishable',  'nonPerishable'),
    ('Produce',         'produce'),
    ('Dairy',           'dairy'),
    ('Meat',            'meat'),
    ('Baked Goods',     'bakedGoods'),
    ('Pet Food',        'petFood'),
    ('Toys',            'toys'),
    ('Hygiene',         'hygiene'),
    ('School Supplies', 'schoolSupplies'),
    ('Other',           'other'),
    ('Perishable',      None),   # computed
    ('Eggs',            None),   # blank (spreadsheet compat)
    ('Total Weight',    'weight'),
    # Contact (optional)
    ('Name/Business',   'contactName'),
    ('Address',         'contactAddress'),
    ('Email',           'contactEmail'),
    ('Phone',           'contactPhone'),
    ('New Donor',       'newDonor'),
]

# Categories that sum into Perishable
PERISHABLE_FIELDS = ['produce', 'dairy', 'meat', 'bakedGoods']

MONTH_NAMES = {
    '01': 'JAN', '02': 'FEB', '03': 'MAR', '04': 'APR',
    '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AUG',
    '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC',
}

HEADER_FILL = PatternFill(start_color='185FA5', end_color='185FA5', fill_type='solid')
HEADER_FONT = Font(bold=True, color='FFFFFF')


def get_xlsx_path(year: str) -> str:
    return os.path.join(DATA_DIR, f'{year} IN.xlsx')


def get_or_create_workbook(year: str):
    path = get_xlsx_path(year)
    if os.path.exists(path):
        return load_workbook(path), path
    wb = Workbook()
    # Remove default sheet
    wb.remove(wb.active)
    return wb, path


def get_or_create_sheet(wb, month: str):
    if month in wb.sheetnames:
        return wb[month], True  # True = already existed
    ws = wb.create_sheet(month)
    # Write header row
    headers = [col[0] for col in COLUMNS]
    for col_idx, header in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.font = HEADER_FONT
        cell.fill = HEADER_FILL
        cell.alignment = Alignment(horizontal='center')
        ws.column_dimensions[get_column_letter(col_idx)].width = max(len(header) + 4, 12)
    return ws, False  # False = newly created


def form_to_row(form: dict) -> list:
    row = []
    for _, field in COLUMNS:
        if field is None:
            row.append(None)  # computed or blank, filled below
        else:
            val = form.get(field, '')
            # Try to convert numeric strings to numbers
            if val and field not in ('date', 'donor', 'other', 'contactName',
                                     'contactAddress', 'contactEmail', 'contactPhone', 'newDonor'):
                try:
                    val = float(val) if '.' in str(val) else int(val)
                except (ValueError, TypeError):
                    pass
            row.append(val if val != '' else None)

    # Compute Perishable (index 12 in COLUMNS)
    perishable_sum = 0
    for field in PERISHABLE_FIELDS:
        idx = next(i for i, (_, f) in enumerate(COLUMNS) if f == field)
        v = row[idx]
        if isinstance(v, (int, float)):
            perishable_sum += v
    row[12] = perishable_sum if perishable_sum > 0 else None  # Perishable
    # Eggs (index 13) stays None

    return row


@app.route('/append', methods=['POST'])
def append_forms():
    data = request.get_json()
    if not data or 'forms' not in data:
        return jsonify({'ok': False, 'error': 'Missing forms'}), 400

    forms = data['forms']
    if not forms:
        return jsonify({'ok': False, 'error': 'No forms provided'}), 400

    # Determine year and month from first form's date, or from payload
    year = data.get('year')
    month = data.get('month')

    if not year or not month:
        # Try to parse from first form's date field (mm/dd/yyyy)
        first_date = forms[0].get('date', '')
        try:
            parts = first_date.split('/')
            month_num = parts[0].zfill(2)
            year = parts[2]
            month = MONTH_NAMES.get(month_num, month_num)
        except (IndexError, AttributeError):
            # Fall back to current date
            now = datetime.datetime.now()
            year = str(now.year)
            month = MONTH_NAMES[str(now.month).zfill(2)]

    wb, path = get_or_create_workbook(year)
    ws, already_existed = get_or_create_sheet(wb, month)

    # Warn if sheet already has data rows (beyond header)
    existing_rows = ws.max_row - 1 if already_existed else 0
    if existing_rows > 0:
        print(f'[warn] Sheet {month} already has {existing_rows} rows — appending anyway')

    # Append rows
    for form in forms:
        row = form_to_row(form)
        ws.append(row)

    wb.save(path)

    return jsonify({
        'ok': True,
        'rows_added': len(forms),
        'file': path,
        'sheet': month,
        'existing_rows': existing_rows,
    })


@app.route('/status', methods=['GET'])
def status():
    files = os.listdir(DATA_DIR) if os.path.exists(DATA_DIR) else []
    return jsonify({'ok': True, 'files': files})


@app.route('/', methods=['GET'])
def index():
    return 'Logbook server running.'


if __name__ == '__main__':
    print('Logbook server starting on http://0.0.0.0:5000')
    print(f'Data directory: {DATA_DIR}')
    app.run(host='0.0.0.0', port=5000, debug=True)