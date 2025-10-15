# 📘 User Feedback Template - Excel Setup Guide

## Quick Start

This guide will help you create the complete OrokiiPay User Feedback Excel workbook from the CSV templates.

---

## 📁 Files Included

You should have the following CSV files in the `/docs` folder:

1. ✅ `OrokiiPay_User_Feedback_Template.csv` - Main feedback log
2. ✅ `AI_Assistant_Feedback_Template.csv` - AI-specific feedback
3. ✅ `Feature_Requests_Template.csv` - Feature requests
4. ✅ `Bug_Reports_Template.csv` - Bug tracking
5. ✅ `User_Satisfaction_Survey_Template.csv` - Satisfaction surveys
6. ✅ `Dropdown_Values_Reference.csv` - Dropdown options
7. ✅ `USER_FEEDBACK_TEMPLATE.md` - Full documentation

---

## 🔧 Setting Up the Excel Workbook

### Step 1: Create New Excel Workbook

1. Open Microsoft Excel (or Google Sheets)
2. Create a new blank workbook
3. Save it as: **`OrokiiPay_User_Feedback_Tracker.xlsx`**

---

### Step 2: Import CSV Files as Sheets

**For Microsoft Excel:**

1. **Import First Sheet (Feedback Log):**
   - Go to `Data` → `Get Data` → `From File` → `From Text/CSV`
   - Select `OrokiiPay_User_Feedback_Template.csv`
   - Click `Load`
   - Rename the sheet to **"Feedback Log"**

2. **Import Remaining Sheets:**
   - Repeat the process for each CSV file:
     - `AI_Assistant_Feedback_Template.csv` → Sheet name: **"AI Assistant Feedback"**
     - `Feature_Requests_Template.csv` → Sheet name: **"Feature Requests"**
     - `Bug_Reports_Template.csv` → Sheet name: **"Bug Reports"**
     - `User_Satisfaction_Survey_Template.csv` → Sheet name: **"Satisfaction Survey"**
     - `Dropdown_Values_Reference.csv` → Sheet name: **"Dropdown Reference"**

**For Google Sheets:**

1. Open Google Sheets
2. Go to `File` → `Import` → `Upload`
3. Upload first CSV file
4. Choose "Insert new sheet(s)"
5. Repeat for all CSV files
6. Rename sheets accordingly

---

### Step 3: Format the Sheets

#### A. Freeze Header Rows

For each sheet:
1. Select Row 2 (first data row)
2. Go to `View` → `Freeze Panes` → `Freeze Top Row`

#### B. Enable Filtering

For each sheet:
1. Click any cell in header row
2. Go to `Data` → `Filter`
3. This adds dropdown arrows to all columns

#### C. Set Column Widths

**Feedback Log Sheet:**
- Columns A-K: 15 characters wide
- Columns L-R (descriptions): 30-40 characters wide
- Columns S-AH: 15 characters wide

**Quick method:** Select all columns → Right-click → Column Width → Auto-fit

#### D. Apply Conditional Formatting

**Priority Column (Column M in Feedback Log):**
1. Select the Priority column
2. Go to `Home` → `Conditional Formatting` → `New Rule`
3. Set up color coding:
   - Critical = Red background
   - High = Orange background
   - Medium = Yellow background
   - Low = Green background

**Status Column (Column Y in Feedback Log):**
1. Select the Status column
2. Apply conditional formatting:
   - New = Light blue
   - Under Review = Yellow
   - In Progress = Orange
   - Resolved = Green
   - Won't Fix = Gray

---

### Step 4: Create Data Validation (Dropdowns)

This is crucial for maintaining data consistency.

#### A. Set Up Named Ranges

1. Go to **"Dropdown Reference"** sheet
2. For each category, create a named range:
   - Select the values in column B for "User Type"
   - Go to `Formulas` → `Define Name`
   - Name it: `UserType_List`
   - Repeat for all categories:
     - `Platform_List`
     - `FeatureModule_List`
     - `FeedbackType_List`
     - `Priority_List`
     - `Severity_List`
     - `AIPersonality_List`
     - `Status_List`
     - `AssignedTo_List`

#### B. Apply Data Validation to Columns

Go to **"Feedback Log"** sheet:

1. **Column E (User Type):**
   - Select all cells in column E (from E2 downward)
   - Go to `Data` → `Data Validation`
   - Allow: `List`
   - Source: `=UserType_List`
   - Show dropdown: ✅

2. **Repeat for all dropdown columns:**
   - Column H (Platform) → `=Platform_List`
   - Column K (Feature/Module) → `=FeatureModule_List`
   - Column L (Feedback Type) → `=FeedbackType_List`
   - Column M (Priority) → `=Priority_List`
   - Column N (Severity) → `=Severity_List`
   - Column V (AI Personality) → `=AIPersonality_List`
   - Column Y (Status) → `=Status_List`
   - Column AA (Assigned To) → `=AssignedTo_List`

3. **Apply similar validation to other sheets** as needed

---

### Step 5: Add Priority Score Formula

In **"Feedback Log"** sheet, column Z (Priority Score):

1. Click cell Z2
2. Enter this formula:

```excel
=IF(N2="Blocker",4,IF(N2="Major",3,IF(N2="Minor",2,1)))*2.5+IF(E2="VIP",2,IF(E2="Beta Tester",1.5,IF(E2="Early Adopter",1,0.5)))
```

3. Copy formula down for all rows
4. Format as number with 1 decimal place

---

### Step 6: Create Analytics Dashboard Sheet

Create a new sheet named **"Dashboard"**

#### Add These Metrics:

**A. Summary Statistics**
```
Total Feedback Count: =COUNTA('Feedback Log'!A:A)-1
Open Items: =COUNTIF('Feedback Log'!Y:Y,"New")+COUNTIF('Feedback Log'!Y:Y,"Under Review")+COUNTIF('Feedback Log'!Y:Y,"In Progress")
Resolved Items: =COUNTIF('Feedback Log'!Y:Y,"Resolved")
Resolution Rate: =Resolved/(Resolved+Open)*100
```

**B. Pivot Tables**

1. **Feedback by Type:**
   - Insert → Pivot Table
   - Source: Feedback Log sheet
   - Rows: Feedback Type
   - Values: Count of Feedback ID

2. **Feedback by Priority:**
   - Rows: Priority
   - Values: Count of Feedback ID

3. **Feedback by Module:**
   - Rows: Feature/Module
   - Values: Count of Feedback ID

4. **Feedback by Status:**
   - Rows: Status
   - Values: Count of Feedback ID

**C. Charts**

1. **Feedback Trend (Line Chart):**
   - X-axis: Submission Date (by week)
   - Y-axis: Count of feedback

2. **Priority Distribution (Pie Chart):**
   - From Priority pivot table

3. **Status Overview (Bar Chart):**
   - From Status pivot table

4. **Module Breakdown (Column Chart):**
   - Top 10 modules by feedback count

---

### Step 7: Protect and Share

#### A. Protect Reference Sheet

1. Go to "Dropdown Reference" sheet
2. Right-click sheet tab → `Protect Sheet`
3. Allow: "Select locked cells" only
4. Set password (optional)

#### B. Set Permissions

**For Excel:**
- Save to SharePoint or OneDrive
- Set sharing permissions:
  - Product Team: Edit access
  - Development Team: Edit access
  - Users submitting feedback: Edit access to Feedback Log only

**For Google Sheets:**
- Share with appropriate permissions
- Consider using Google Forms for user submissions (imports to sheet)

---

### Step 8: Add User Submission Form (Optional but Recommended)

**If using Google Sheets:**

1. Go to `Tools` → `Create a new form`
2. Link form to "Feedback Log" sheet
3. Create form fields matching columns
4. Share form link with beta testers

**If using Microsoft Excel:**

1. Create a Microsoft Form
2. Export responses to Excel
3. Or use Power Automate to sync form submissions

---

## 🎨 Recommended Formatting

### Color Scheme

**Header Row:**
- Background: Dark blue (#010080 - OrokiiPay primary color)
- Text: White
- Font: Bold, 11pt

**Alternate Row Colors:**
- Even rows: White
- Odd rows: Light gray (#F5F5F5)

### Icons/Visual Indicators

Add these to the header row for better visual organization:

- Priority column: ⚠️
- Status column: 📊
- AI-related columns: 🤖
- User satisfaction: ⭐
- Assigned To: 👤

---

## 📱 Mobile Access

**For field testing and on-the-go feedback:**

1. **Excel Mobile App:**
   - Download Microsoft Excel app
   - Open shared workbook from OneDrive
   - Can view and add feedback on mobile

2. **Google Sheets Mobile:**
   - Download Google Sheets app
   - Full editing capability on mobile

3. **Dedicated Feedback Form:**
   - Create mobile-friendly form (Google Forms/Microsoft Forms)
   - Link form to Excel sheet
   - Share form URL with testers

---

## 🔄 Automated Workflows (Advanced)

### A. Email Notifications

**Using Power Automate (Microsoft):**
1. Trigger: When a new row is added to "Feedback Log"
2. Condition: If Priority = "Critical" OR Severity = "Blocker"
3. Action: Send email to Product Manager

**Using Google Apps Script:**
```javascript
function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  if (sheet.getName() == "Feedback Log") {
    var range = e.range;
    if (range.getColumn() == 13) { // Priority column
      var priority = range.getValue();
      if (priority == "Critical") {
        // Send email notification
        MailApp.sendEmail({
          to: "product@orokiipay.com",
          subject: "Critical Feedback Submitted",
          body: "New critical feedback requires immediate attention."
        });
      }
    }
  }
}
```

### B. Automatic ID Generation

Add this formula to cell A2 in Feedback Log:

```excel
="FB-"&TEXT(TODAY(),"YYYY")&"-"&TEXT(ROW()-1,"000")
```

Copy down for all rows.

### C. Auto-Update Timestamps

For "Submission Date" column, you can use:
- Manual entry
- Or VBA/Script for automatic timestamp when row is created

---

## 📊 Weekly Review Process

### Recommended Workflow:

**Monday Morning:**
1. Review all "New" feedback from previous week
2. Assign priorities and owners
3. Update status to "Under Review" or "In Progress"

**Daily:**
1. Check critical/high priority items
2. Update status as work progresses
3. Add internal notes

**Friday Afternoon:**
1. Update all resolved items
2. Prepare weekly summary report
3. Export filtered data for sprint planning

---

## 🔍 Common Filters & Views

### Create these saved filter views:

1. **Critical Issues Only:**
   - Priority = Critical
   - Status ≠ Resolved

2. **My Tasks:**
   - Assigned To = [Your Name]
   - Status = In Progress

3. **AI Feedback:**
   - Feature/Module = AI Assistant
   - OR Feedback Type = AI Assistant

4. **This Week:**
   - Submission Date >= Start of this week

5. **Unresolved Bugs:**
   - Feedback Type = Bug
   - Status ≠ Resolved

---

## ✅ Quality Checklist

Before sharing with team:

- [ ] All CSV files imported correctly
- [ ] Header rows frozen on all sheets
- [ ] Data validation applied to dropdown columns
- [ ] Conditional formatting applied (Priority, Status)
- [ ] Priority Score formula working
- [ ] Dashboard sheet created with pivot tables
- [ ] Charts showing data correctly
- [ ] Dropdown Reference sheet protected
- [ ] File shared with appropriate permissions
- [ ] Team trained on how to use template
- [ ] Backup process established

---

## 🆘 Troubleshooting

**Problem: Dropdowns not showing**
- Solution: Check that named ranges are created correctly
- Verify data validation is applied to entire column

**Problem: Formulas showing errors**
- Solution: Check that sheet names match exactly (case-sensitive)
- Verify cell references are correct

**Problem: Can't edit certain cells**
- Solution: Check if sheet is protected
- Unprotect sheet: Review → Unprotect Sheet

**Problem: Pivot tables not updating**
- Solution: Right-click pivot table → Refresh

---

## 📞 Support

For help with the feedback template:
- **Technical Issues:** development@orokiipay.com
- **Process Questions:** Product Manager
- **Template Improvements:** Submit feedback in the template! (meta!)

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Oct 12, 2025 | Initial template creation |

---

**Template Setup Guide Version:** 1.0
**Last Updated:** October 12, 2025
**Next Review:** January 2026
