"""
Logbook Flask server
Receives staged donation forms from the app and appends to XLSX.
Also provides OCR via Claude Vision for handwritten donation forms.

File structure: one file per year (e.g. "2026 IN.xlsx")
                one tab per month (e.g. "JUN")

POST /append
  Body: { "forms": [...], "month": "JUN", "year": "2026" }
  Response: { "ok": true, "rows_added": N }

POST /ocr
  Body: { "image": "<base64 encoded image>" }
  Response: { "ok": true, "fields": { ... } }
"""

from flask import Flask, request, jsonify
from openpyxl import load_workbook, Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
import os
import datetime
import json
import anthropic
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))

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

OCR_PROMPT = """You are extracting data from a PortCares In-Kind Donations form.

The form has these fields:
- Date Received (mm/dd/yyyy)
- Donor/Event (free text, e.g. "SDM", "Port BIC", "Anon")
- Weight (total weight in lbs)
- Categories with weights written next to the circled ones:
  Non-Perishable, Produce, Dairy, Meat, Baked Goods, Pet Food, Toys, Hygiene, School Supplies
- Other (free text, usually blank)
- Contact info (often blank): Name/Business, Address, Email, Phone, New Donor (Yes/No)

Extract all visible values and return ONLY a JSON object with these exact keys:
{
  "date": "",
  "donor": "",
  "weight": "",
  "nonPerishable": "",
  "produce": "",
  "dairy": "",
  "meat": "",
  "bakedGoods": "",
  "petFood": "",
  "toys": "",
  "hygiene": "",
  "schoolSupplies": "",
  "other": "",
  "contactName": "",
  "contactAddress": "",
  "contactEmail": "",
  "contactPhone": "",
  "newDonor": ""
}

Rules:
- Only include values you can clearly read. Leave blank if uncertain.
- For categories, only include a value if that category is circled/selected AND has a number written next to it.
- Weight values should be numbers only (no "lbs" or units).
- Date should be in mm/dd/yyyy format.
- newDonor should be "yes", "no", or "" if not filled.
- Return ONLY the JSON object, no other text.
"""


@app.route('/ocr', methods=['POST'])
def ocr():
    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({'ok': False, 'error': 'Missing image'}), 400

    image_data = data['image']
    # Strip data URL prefix if present (e.g. "data:image/jpeg;base64,...")
    if ',' in image_data:
        image_data = image_data.split(',')[1]

    try:
        message = client.messages.create(
            model='claude-haiku-4-5',
            max_tokens=1024,
            messages=[
                {
                    'role': 'user',
                    'content': [
                        {
                            'type': 'image',
                            'source': {
                                'type': 'base64',
                                'media_type': 'image/jpeg',
                                'data': image_data,
                            },
                        },
                        {
                            'type': 'text',
                            'text': OCR_PROMPT,
                        }
                    ],
                }
            ],
        )

        raw = message.content[0].text.strip()
        # Strip markdown code fences if present
        if raw.startswith('```'):
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
        fields = json.loads(raw.strip())
        return jsonify({'ok': True, 'fields': fields})

    except Exception as e:
        print(f'OCR error: {e}')
        return jsonify({'ok': False, 'error': str(e)}), 500


def get_xlsx_path(year: str) -> str:
    return os.path.join(DATA_DIR, f'{year} IN.xlsx')


def get_or_create_workbook(year: str):
    path = get_xlsx_path(year)
    if os.path.exists(path):
        return load_workbook(path), path
    wb = Workbook()
    wb.remove(wb.active)
    return wb, path


def get_or_create_sheet(wb, month: str):
    if month in wb.sheetnames:
        return wb[month], True
    ws = wb.create_sheet(month)
    headers = [col[0] for col in COLUMNS]
    for col_idx, header in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.font = HEADER_FONT
        cell.fill = HEADER_FILL
        cell.alignment = Alignment(horizontal='center')
        ws.column_dimensions[get_column_letter(col_idx)].width = max(len(header) + 4, 12)
    return ws, False


def form_to_row(form: dict) -> list:
    row = []
    for _, field in COLUMNS:
        if field is None:
            row.append(None)
        else:
            val = form.get(field, '')
            if val and field not in ('date', 'donor', 'other', 'contactName',
                                     'contactAddress', 'contactEmail', 'contactPhone', 'newDonor'):
                try:
                    val = float(val) if '.' in str(val) else int(val)
                except (ValueError, TypeError):
                    pass
            row.append(val if val != '' else None)

    perishable_sum = 0
    for field in PERISHABLE_FIELDS:
        idx = next(i for i, (_, f) in enumerate(COLUMNS) if f == field)
        v = row[idx]
        if isinstance(v, (int, float)):
            perishable_sum += v
    row[12] = perishable_sum if perishable_sum > 0 else None
    return row


@app.route('/append', methods=['POST'])
def append_forms():
    data = request.get_json()
    if not data or 'forms' not in data:
        return jsonify({'ok': False, 'error': 'Missing forms'}), 400

    forms = data['forms']
    if not forms:
        return jsonify({'ok': False, 'error': 'No forms provided'}), 400

    year = data.get('year')
    month = data.get('month')

    if not year or not month:
        first_date = forms[0].get('date', '')
        try:
            parts = first_date.split('/')
            month_num = parts[0].zfill(2)
            year = parts[2]
            month = MONTH_NAMES.get(month_num, month_num)
        except (IndexError, AttributeError):
            now = datetime.datetime.now()
            year = str(now.year)
            month = MONTH_NAMES[str(now.month).zfill(2)]

    wb, path = get_or_create_workbook(year)
    ws, already_existed = get_or_create_sheet(wb, month)

    existing_rows = ws.max_row - 1 if already_existed else 0
    if existing_rows > 0:
        print(f'[warn] Sheet {month} already has {existing_rows} rows — appending anyway')

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