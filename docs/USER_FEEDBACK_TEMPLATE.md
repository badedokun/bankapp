# 📋 User Feedback Template - OrokiiPay Banking App

## Overview
This document provides the structure for the Excel-based User Feedback Collection Template. The template consists of multiple sheets for comprehensive feedback management.

---

## 📊 Excel Workbook Structure

### **Sheet 1: Feedback Log (Main Sheet)**

This is the primary sheet where all user feedback is recorded.

| Column | Field Name | Description | Data Type | Example |
|--------|-----------|-------------|-----------|---------|
| A | Feedback ID | Auto-generated unique identifier | Text | FB-2025-001 |
| B | Submission Date | Date and time feedback was submitted | DateTime | 2025-10-12 14:30 |
| C | User Name | Name of user providing feedback | Text | John Doe |
| D | User Email | Email address for follow-up | Email | john.doe@email.com |
| E | User Type | User segment/role | Dropdown | Beta Tester, Early Adopter, Regular User, VIP |
| F | Phone Number | Contact number (optional) | Text | +234 803 123 4567 |
| G | App Version | Build version being tested | Text | v2.1.0-beta |
| H | Platform | Device platform | Dropdown | iOS, Android, Web |
| I | Device Model | Specific device used | Text | iPhone 14 Pro, Samsung Galaxy S23 |
| J | OS Version | Operating system version | Text | iOS 17.0, Android 14 |
| K | Feature/Module | Which part of the app | Dropdown | Dashboard, Transfers, AI Assistant, Savings, Loans, Bills, Settings, Rewards, Onboarding, Security, Other |
| L | Feedback Type | Category of feedback | Dropdown | Bug, Feature Request, UI/UX Improvement, Performance Issue, Content/Copy, AI Assistant, Gamification, General Comment |
| M | Priority | Urgency level | Dropdown | Critical, High, Medium, Low |
| N | Severity | Impact on user experience | Dropdown | Blocker, Major, Minor, Cosmetic |
| O | Feedback Title | Short summary | Text | AI Assistant not responding to transfer requests |
| P | Detailed Description | Full feedback description | Long Text | When I ask the AI to help me transfer money, it shows "thinking" but never responds. This happened 3 times today. |
| Q | Steps to Reproduce | For bugs - how to replicate | Long Text | 1. Open AI chat 2. Type "send ₦5000 to John" 3. Wait - no response |
| R | Expected Behavior | What should happen | Text | AI should ask for recipient details and initiate transfer |
| S | Actual Behavior | What actually happens | Text | AI shows typing indicator indefinitely |
| T | Screenshot/Attachment | Reference to attached files | Text | screenshot_001.png, video_recording.mp4 |
| U | AI-Specific Feedback | For AI Assistant feedback | Long Text | AI personality feels too formal. Prefer more friendly tone like Cleo AI |
| V | AI Personality Used | Which AI mode was active | Dropdown | Friendly, Professional, Playful, Roast Mode |
| W | Suggested Improvement | User's recommendation | Long Text | Add quick action buttons for common tasks |
| X | User Satisfaction | Rating before issue/feedback | Dropdown | Very Satisfied, Satisfied, Neutral, Dissatisfied, Very Dissatisfied |
| Y | Status | Current state of feedback | Dropdown | New, Under Review, In Progress, Resolved, Won't Fix, Duplicate, Need More Info |
| Z | Priority Score | Calculated priority (1-10) | Number | 8 |
| AA | Assigned To | Team member handling this | Dropdown | Development Team, Design Team, AI Team, Product Manager, QA Team |
| AB | Tags | Additional categorization | Text | #critical #ai #payments #ux |
| AC | Internal Notes | Team comments | Long Text | Duplicate of FB-2025-045. Fixed in v2.2.0 |
| AD | Resolution Date | When issue was resolved | DateTime | 2025-10-15 10:00 |
| AE | Resolution Notes | How issue was addressed | Long Text | Increased AI timeout from 5s to 15s. Added retry logic. |
| AF | Follow-up Required | Does user need update? | Dropdown | Yes, No |
| AG | Follow-up Date | When to contact user | DateTime | 2025-10-20 |
| AH | Build Fixed In | Version where fix was deployed | Text | v2.2.0 |

---

### **Sheet 2: AI Assistant Feedback (Detailed)**

Specific sheet for AI-related feedback with detailed metrics.

| Column | Field Name | Description |
|--------|-----------|-------------|
| A | Feedback ID | Reference to main feedback log |
| B | AI Feature | Specific AI feature tested |
| C | AI Response Quality | Rating 1-5 stars |
| D | AI Response Speed | Rating 1-5 stars |
| E | AI Personality Fit | Did personality match expectation? |
| F | Conversation Context | Was context maintained? |
| G | AI Proactivity | Were proactive insights helpful? |
| H | Roast Mode Feedback | If roast mode enabled, was it funny/helpful? |
| I | AI Accuracy | Were AI suggestions accurate? |
| J | AI Misunderstandings | What did AI misunderstand? |
| K | Preferred AI Tone | User's preference |
| L | Missing AI Features | What AI capabilities are needed? |
| M | AI vs Human Support | Would user prefer human? |
| N | AI Trust Level | Rating 1-5 |
| O | Specific AI Quote | Exact AI response that was good/bad |
| P | Improvement Suggestion | Specific AI improvement |

---

### **Sheet 3: Gamification & Rewards Feedback**

Feedback on reward system, achievements, and gamification.

| Column | Field Name | Description |
|--------|-----------|-------------|
| A | Feedback ID | Reference to main feedback log |
| B | Feature | Achievement, Daily Challenge, Streak, Reward Catalog, Points System, Tier System |
| C | Engagement Level | How engaging is the feature? (1-5) |
| D | Clarity | Is it clear how to earn rewards? (1-5) |
| E | Motivation | Does it motivate desired behavior? (1-5) |
| F | Reward Value | Are rewards valuable? (1-5) |
| G | Achievement Difficulty | Too easy, Just Right, Too Hard |
| H | Favorite Feature | What gamification feature do they like most? |
| I | Least Favorite | What needs improvement? |
| J | Suggested Rewards | What rewards would they want? |
| K | Comparison | How does it compare to other apps? |

---

### **Sheet 4: UI/UX Feedback**

Visual design, usability, and user experience feedback.

| Column | Field Name | Description |
|--------|-----------|-------------|
| A | Feedback ID | Reference to main feedback log |
| B | Screen/Component | Specific UI element |
| C | Design Rating | Visual appeal (1-5) |
| D | Usability Rating | Ease of use (1-5) |
| E | Issue Type | Confusing, Hard to find, Too cluttered, Too minimal, Poor contrast, Other |
| F | Color Scheme | Feedback on tenant branding |
| G | Typography | Font readability feedback |
| H | Icons/Imagery | Icon clarity feedback |
| I | Animation | Too fast, Too slow, Just right, Distracting |
| J | Glassmorphism | Feedback on glass effect |
| K | Spacing/Layout | Layout issues |
| L | Mobile vs Desktop | Platform-specific issues |
| M | Accessibility | Any accessibility concerns |
| N | Comparison | Better/worse than which app? |
| O | Screenshot Reference | Reference to visual feedback |

---

### **Sheet 5: Feature Requests**

New features users want to see.

| Column | Field Name | Description |
|--------|-----------|-------------|
| A | Request ID | Unique identifier |
| B | Submission Date | When requested |
| C | Requested By | User name |
| D | Feature Category | Module where feature belongs |
| E | Feature Title | Short description |
| F | Detailed Description | What exactly do they want? |
| G | Use Case | Why do they need this? |
| H | Frequency of Need | Daily, Weekly, Monthly, Rarely |
| I | Priority (User) | How important to user? (1-5) |
| J | Similar Feature In | Which app has this? |
| K | Votes | How many users want this? |
| L | Feasibility | Easy, Medium, Hard, Very Hard |
| M | Estimated Effort | Story points / days |
| N | Business Value | High, Medium, Low |
| O | Planned Release | Which version? |
| P | Status | Backlog, Planned, In Progress, Released, Rejected |

---

### **Sheet 6: Bug Reports**

Dedicated sheet for technical issues.

| Column | Field Name | Description |
|--------|-----------|-------------|
| A | Bug ID | Unique identifier |
| B | Reported Date | When bug was found |
| C | Reported By | User name |
| D | App Version | Build with bug |
| E | Platform | iOS/Android/Web |
| F | Bug Title | Short summary |
| G | Severity | Blocker, Critical, Major, Minor |
| H | Frequency | Always, Often, Sometimes, Rarely |
| I | Steps to Reproduce | Detailed steps |
| J | Expected Result | What should happen |
| K | Actual Result | What actually happens |
| L | Error Messages | Any error text/codes |
| M | Console Logs | Reference to logs |
| N | Screenshot/Video | Visual evidence |
| O | Reproducible | Yes, No, Intermittent |
| P | Workaround | Temporary fix |
| Q | Root Cause | Technical cause |
| R | Fix Description | How it was fixed |
| S | Fixed In Version | Build with fix |
| T | Status | New, Confirmed, In Progress, Fixed, Closed |
| U | Verified By | QA tester name |
| V | Verified Date | When fix was verified |

---

### **Sheet 7: Performance Metrics**

App performance and speed feedback.

| Column | Field Name | Description |
|--------|-----------|-------------|
| A | Feedback ID | Reference to main feedback log |
| B | Performance Area | App Startup, Screen Load, Transaction Processing, AI Response, Data Sync |
| C | Performance Rating | 1-5 stars |
| D | Load Time Reported | User's estimate (seconds) |
| E | Issue Frequency | Always, Often, Sometimes, Rarely |
| F | Network Condition | WiFi, 4G, 3G, Poor |
| G | Battery Impact | High, Medium, Low, None Noticed |
| H | Data Usage | Excessive, Normal, Low |
| I | Crash/Freeze | Did app crash? |
| J | Memory Issues | App sluggish? |
| K | Comparison | Faster/slower than which app? |

---

### **Sheet 8: User Satisfaction Survey**

Periodic satisfaction measurements.

| Column | Field Name | Description |
|--------|-----------|-------------|
| A | Response ID | Unique ID |
| B | Survey Date | When completed |
| C | User Email | Respondent |
| D | Overall Satisfaction | 1-5 stars |
| E | NPS Score | 0-10 (Net Promoter Score) |
| F | Ease of Use | 1-5 stars |
| G | Visual Design | 1-5 stars |
| H | AI Assistant | 1-5 stars |
| I | Features Completeness | 1-5 stars |
| J | Performance/Speed | 1-5 stars |
| K | Security Trust | 1-5 stars |
| L | Gamification | 1-5 stars |
| M | Favorite Feature | Open text |
| N | Least Favorite | Open text |
| O | Most Needed Feature | Open text |
| P | Would Recommend? | Yes, Maybe, No |
| Q | Why/Why Not? | Open text |
| R | Compared to Other Banks | Better, Same, Worse |
| S | Primary Use Case | What do they use app for most? |
| T | Usage Frequency | Daily, Weekly, Monthly |

---

### **Sheet 9: Feedback Analytics Dashboard**

Summary sheet with pivot tables and charts (read-only for users).

**Metrics to Track:**
- Total feedback count
- Feedback by type (Bug, Feature Request, etc.)
- Feedback by priority
- Feedback by module/feature
- AI Assistant feedback trends
- Average satisfaction ratings
- Top requested features
- Most common bugs
- Response time (submission to resolution)
- Resolution rate

---

### **Sheet 10: Dropdown Values Reference**

Master list of dropdown values for consistency.

| Category | Values |
|----------|--------|
| User Type | Beta Tester, Early Adopter, Regular User, VIP, Internal Team |
| Platform | iOS, Android, Web, All Platforms |
| Feature/Module | Dashboard, Transfers, AI Assistant, Savings, Loans, Bills, Rewards, Settings, Onboarding, Security, History, Referrals, Profile, Other |
| Feedback Type | Bug, Feature Request, UI/UX Improvement, Performance Issue, Content/Copy, AI Assistant, Gamification, Security Concern, General Comment |
| Priority | Critical, High, Medium, Low |
| Severity | Blocker, Major, Minor, Cosmetic |
| AI Personality | Friendly, Professional, Playful, Roast Mode, Not Applicable |
| Status | New, Under Review, In Progress, Resolved, Won't Fix, Duplicate, Need More Info, Deferred |
| Assigned To | Development Team, Design Team, AI Team, Product Manager, QA Team, DevOps, Unassigned |

---

## 📝 How to Use This Template

### For Users (Feedback Providers):
1. Open the Excel file
2. Go to "Feedback Log" sheet
3. Fill in one row per feedback item
4. Use dropdowns for standardized fields
5. Be as detailed as possible in description fields
6. Attach screenshots/videos separately (reference filename)

### For Product Team:
1. Review new feedback daily
2. Assign priority scores
3. Assign to appropriate team member
4. Update status as feedback is addressed
5. Provide resolution notes
6. Track metrics in Analytics Dashboard

### For Development Team:
1. Filter feedback by "Assigned To" = Your team
2. Sort by Priority
3. Review detailed descriptions and steps to reproduce
4. Update status as you work
5. Add internal notes for tracking
6. Update "Fixed In Version" when complete

---

## 🔄 Feedback Workflow

```
1. User Submits Feedback
   ↓
2. Product Manager Reviews (within 24h)
   ↓
3. Categorize, Prioritize, Assign
   ↓
4. Team Member Acknowledges
   ↓
5. Investigation/Implementation
   ↓
6. Resolution/Fix
   ↓
7. QA Verification
   ↓
8. Deployed in Build
   ↓
9. User Notification (if follow-up required)
   ↓
10. Close Feedback
```

---

## 🎯 Priority Scoring Formula

**Priority Score (1-10) = (Severity × 2.5) + (User Type Weight) + (Frequency Weight)**

**Severity:**
- Blocker: 4
- Major: 3
- Minor: 2
- Cosmetic: 1

**User Type Weight:**
- VIP: +2
- Beta Tester: +1.5
- Early Adopter: +1
- Regular User: +0.5

**Frequency Weight:**
- Always: +2
- Often: +1.5
- Sometimes: +1
- Rarely: +0.5

---

## 📊 Success Metrics

Track these KPIs from feedback data:
- **Response Time:** Average time from submission to first response
- **Resolution Time:** Average time from submission to resolution
- **User Satisfaction Trend:** Week-over-week satisfaction scores
- **Bug Resolution Rate:** % of bugs fixed within sprint
- **Feature Implementation Rate:** % of requested features implemented
- **NPS Score:** Net Promoter Score trend
- **AI Assistant Rating:** Average AI satisfaction score
- **Gamification Engagement:** Reward system feedback scores

---

## 🔐 Data Privacy & Security

**IMPORTANT:**
- Store Excel file in secure, access-controlled location
- Do NOT include sensitive financial data
- Anonymize user data if sharing externally
- Comply with data retention policies
- Back up feedback data regularly

---

## 📅 Review Cadence

- **Daily:** Review new critical/high priority feedback
- **Weekly:** Team feedback review meeting
- **Bi-weekly:** Update users on feedback status
- **Monthly:** Analyze trends and update product roadmap
- **Quarterly:** Comprehensive feedback report to stakeholders

---

## 📞 Support

For questions about the feedback template:
- Product Team Lead
- Project Manager
- development@orokiipay.com

---

**Template Version:** 1.0
**Last Updated:** October 12, 2025
**Next Review:** January 2026
