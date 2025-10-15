# 🏦 User Feedback Template Generator

Automated Python script to generate a complete, fully-formatted Excel workbook for collecting and managing user feedback for OrokiiPay banking app.

---

## 🚀 Quick Start

### Prerequisites

- Python 3.7 or higher
- pip (Python package manager)

### Installation

1. **Install dependencies:**

```bash
cd /Users/bisiadedokun/bankapp/scripts
pip install -r requirements-feedback.txt
```

Or install directly:

```bash
pip install openpyxl
```

### Generate the Excel Template

2. **Run the script:**

```bash
python generate_feedback_template.py
```

3. **Output:**

The script will create `OrokiiPay_User_Feedback_Tracker.xlsx` in the `docs/` folder.

---

## ✨ What This Script Does

### 1. **Imports CSV Data**
- Reads all 6 CSV template files
- Creates separate Excel sheets for each

### 2. **Applies Professional Formatting**
- ✅ Header row: Dark blue background, white bold text
- ✅ Alternate row colors: Gray/white for readability
- ✅ Auto-fitted columns
- ✅ Frozen header row
- ✅ Auto-filters enabled

### 3. **Creates Data Validation (Dropdowns)**
- ✅ User Type dropdown (Beta Tester, Early Adopter, etc.)
- ✅ Platform dropdown (iOS, Android, Web)
- ✅ Feature/Module dropdown (Dashboard, Transfers, AI, etc.)
- ✅ Priority dropdown (Critical, High, Medium, Low)
- ✅ Status dropdown (New, In Progress, Resolved, etc.)
- ✅ 9 total dropdown fields for consistency

### 4. **Adds Smart Formulas**
- ✅ Priority Score calculation (auto-calculates based on severity + user type)
- ✅ Dashboard metrics (total feedback, open items, NPS, etc.)

### 5. **Applies Conditional Formatting**
- ✅ Priority column: Color-coded (Critical=Red, High=Orange, etc.)
- ✅ Status column: Color-coded (New=Blue, Resolved=Green, etc.)

### 6. **Creates Dashboard Sheet**
- ✅ Summary metrics
- ✅ Quick stats (NPS, satisfaction, AI rating)
- ✅ Auto-updating formulas

### 7. **Adds Instructions Sheet**
- ✅ Quick start guide for users
- ✅ Team workflow instructions
- ✅ Sheet descriptions

### 8. **Protects Reference Data**
- ✅ Locks Dropdown Reference sheet
- ✅ Prevents accidental edits to master data

---

## 📁 Output Structure

```
OrokiiPay_User_Feedback_Tracker.xlsx
├── 📊 Dashboard                    (Summary metrics & charts)
├── 📖 Instructions                 (How to use the template)
├── 📋 Feedback Log                 (Main feedback collection)
├── 🤖 AI Assistant Feedback        (AI-specific metrics)
├── ✨ Feature Requests             (New feature tracking)
├── 🐛 Bug Reports                  (Bug tracking)
├── ⭐ Satisfaction Survey          (NPS & satisfaction)
└── 🔒 Dropdown Reference           (Protected master data)
```

---

## 🎨 Customization

### Changing Colors

Edit the `COLORS` dictionary in the script:

```python
COLORS = {
    "primary": "010080",        # OrokiiPay dark blue
    "header_bg": "010080",      # Header background
    "critical": "FF0000",       # Red for critical
    # ... etc
}
```

### Adding New Sheets

Add to the `CSV_FILES` dictionary:

```python
CSV_FILES = {
    "New Sheet Name": "new_template.csv",
}
```

### Modifying Formulas

Edit the formula sections:

```python
def add_priority_formula(ws, sheet_name):
    formula = """=YOUR_CUSTOM_FORMULA"""
```

---

## 🔧 Troubleshooting

### Error: "openpyxl is not installed"

**Solution:**
```bash
pip install openpyxl
```

### Error: "CSV file not found"

**Solution:**
- Ensure all CSV files are in the `docs/` folder
- Check file names match exactly (case-sensitive)

### Error: "Permission denied"

**Solution:**
- Close the Excel file if it's open
- Check file permissions
- Try running with administrator privileges (if needed)

### Script runs but Excel file is empty

**Solution:**
- Check CSV files have data
- Verify CSV files are properly formatted (UTF-8 encoding)
- Check console output for warnings

---

## 📊 Script Output Example

```
======================================================================
🏦 OrokiiPay User Feedback Template Generator
======================================================================

📂 Checking for CSV template files...
   ✅ Found: OrokiiPay_User_Feedback_Template.csv
   ✅ Found: AI_Assistant_Feedback_Template.csv
   ✅ Found: Feature_Requests_Template.csv
   ✅ Found: Bug_Reports_Template.csv
   ✅ Found: User_Satisfaction_Survey_Template.csv
   ✅ Found: Dropdown_Values_Reference.csv
   ✅ All CSV files found!

📝 Creating new Excel workbook...
   ✅ Workbook created

📊 Importing Feedback Log...
   ✅ Feedback Log imported (3 rows, 34 columns)
📊 Importing AI Assistant Feedback...
   ✅ AI Assistant Feedback imported (4 rows, 16 columns)
...

🎨 Applying Formatting...
🔢 Adding priority score formula...
🎨 Adding conditional formatting...
📊 Creating Dashboard sheet...
🔒 Protecting Dropdown Reference sheet...

💾 Saving Excel Workbook...
✅ Success! Workbook saved to:
   📁 /Users/bisiadedokun/bankapp/docs/OrokiiPay_User_Feedback_Tracker.xlsx

📊 File size: 45.2 KB
📋 Total sheets: 8

======================================================================
🎉 Template Generation Complete!
======================================================================

📌 Next Steps:
   1. Open the Excel file
   2. Review the 📖 Instructions sheet
   3. Check the Dashboard for sample metrics
   4. Share with your team
   5. Start collecting feedback!
```

---

## 🔄 Re-running the Script

**The script is safe to re-run:**
- It will overwrite the existing Excel file
- CSV data is preserved (source files unchanged)
- Useful for:
  - Updating formatting after changes
  - Regenerating if file is corrupted
  - Creating fresh template

**To preserve existing feedback:**
1. Rename the existing Excel file before re-running
2. Or manually copy feedback data to the new file

---

## 📚 Related Documentation

- **USER_FEEDBACK_TEMPLATE.md** - Complete template specification
- **FEEDBACK_TEMPLATE_SETUP_GUIDE.md** - Manual Excel setup guide
- **FEEDBACK_SYSTEM_README.md** - System overview and best practices

---

## 🛠️ Advanced Usage

### Batch Processing

Process multiple templates:

```python
for tenant in ['fmfb', 'orokii', 'generic']:
    OUTPUT_FILE = f"Feedback_Tracker_{tenant}.xlsx"
    main()
```

### Integration with CI/CD

Add to your deployment pipeline:

```yaml
# .github/workflows/generate-feedback-template.yml
- name: Generate Feedback Template
  run: |
    pip install openpyxl
    python scripts/generate_feedback_template.py
```

### Custom Validations

Add custom validation rules:

```python
def add_custom_validation(ws):
    # Email validation
    email_validation = DataValidation(
        type="custom",
        formula1='=ISNUMBER(MATCH("*@*",D:D,0))'
    )
    ws.add_data_validation(email_validation)
```

---

## 🤝 Contributing

Found a bug or have a suggestion?

1. Update the script
2. Test with `python generate_feedback_template.py`
3. Submit your improvements to the team

---

## 📞 Support

**Questions or issues?**
- Email: development@orokiipay.com
- Check: `USER_FEEDBACK_TEMPLATE.md` for template questions
- Check: This README for script questions

---

## 📝 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Oct 12, 2025 | Initial script creation |

---

**Script Version:** 1.0
**Author:** OrokiiPay Development Team
**Last Updated:** October 12, 2025
