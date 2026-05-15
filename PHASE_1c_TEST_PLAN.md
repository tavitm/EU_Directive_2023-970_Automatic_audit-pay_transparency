# Phase 1c Test Plan - Jobs Management Integration

**Date:** 2026-05-14  
**Component:** Jobs Management Pages (`pages/jobs/index.tsx`, `pages/jobs/create.tsx`)  
**Status:** READY FOR TESTING  
**Objective:** Validate complete integration of jobs list and creation pages with job evaluation API including multi-step form and filtering

---

## Test Environment Setup

### Prerequisites
- [ ] Node.js 18+ running
- [ ] Development server running: `npm run dev`
- [ ] Backend API running on `http://localhost:3000/api/`
- [ ] Browser with DevTools open (F12)
- [ ] Chrome/Firefox for testing

### Demo Accounts
Use password: `password123` for all accounts

| Email | Role | Expected Access |
|-------|------|-----------------|
| manager@company.com | MANAGER | NO access (redirect to dashboard) |
| hr@company.com | HR_SPECIALIST | Full access to create & list jobs |
| compliance@company.com | COMPLIANCE_OFFICER | View access to jobs list, can approve |
| admin@company.com | ADMIN | Full access to all features |
| employee@company.com | EMPLOYEE | Should NOT see jobs (redirect to dashboard) |

---

## Test Cases

### Test 1: Page Access & Authorization ✅ IMPLEMENTATION

**Objective:** Verify only authorized roles can access jobs pages

**Steps:**
1. Login as employee@company.com
2. Try to navigate to /jobs
3. Verify redirect to /dashboard
4. Login as hr@company.com
5. Navigate to /jobs
6. Verify page loads successfully
7. Login as compliance@company.com
8. Navigate to /jobs
9. Verify page loads successfully

**Expected Results:**
- [ ] EMPLOYEE role redirected to dashboard
- [ ] MANAGER role redirected to dashboard
- [ ] HR_SPECIALIST role can access jobs page
- [ ] COMPLIANCE_OFFICER role can access jobs page
- [ ] ADMIN role can access jobs page
- [ ] No console errors on load

**Log Results:**
- Redirect working: YES / NO
- Authorized roles can access: YES / NO
- Status: PASS / FAIL

---

### Test 2: Hook Integration & API Calls ✅ IMPLEMENTATION

**Objective:** Verify useJobs hook properly calls API endpoints

**Steps:**
1. Login as hr@company.com
2. Open DevTools Network tab
3. Navigate to /jobs
4. Observe API requests made

**Expected Requests:**
- [ ] GET `/api/jobs` - Status: 200 (or uses listJobs hook)
- [ ] Request includes Bearer token in Authorization header
- [ ] Response includes job evaluation data structure

**Response Validation:**
- [ ] response.data contains jobs array
- [ ] Each job has required fields (jobCode, title, department, status)
- [ ] Data transformation properly extracts nested fields
- [ ] Response time < 500ms

**Log Results:**
- API endpoint called: YES / NO
- HTTP status code: ___
- Response time: ___ ms
- Status: PASS / FAIL

---

### Test 3: Jobs List Display ✅ IMPLEMENTATION

**Objective:** Verify jobs list displays correctly

**Login as:** hr@company.com

**List Display:**
- [ ] Page title shows "Job Evaluations" or similar
- [ ] Jobs are displayed as cards/rows with:
  - [ ] Job title (large, bold)
  - [ ] Job code (e.g., "ENG-001")
  - [ ] Department name
  - [ ] Status badge (DRAFT/SUBMITTED/ACTIVE)
  - [ ] Creation date
  - [ ] Last updated date
  - [ ] Evaluation method

**Job Count:**
- [ ] Shows correct number of jobs
- [ ] "No jobs found" message displays when empty
- [ ] "Create first job" button shows when list is empty

**Status Badges:**
- [ ] DRAFT = Primary color (blue)
- [ ] SUBMITTED = Warning color (yellow)
- [ ] ACTIVE = Success color (green)

**Log Results:**
- All fields display: YES / NO
- Colors correct: YES / NO
- Count accurate: YES / NO
- Status: PASS / FAIL

---

### Test 4: Filters & Data Refresh ✅ IMPLEMENTATION

**Objective:** Verify filter controls work and trigger data updates

**Steps:**
1. Login as hr@company.com
2. Open /jobs page
3. Note initial job count
4. Change Department filter to "Engineering"
5. Observe data refresh
6. Change Status filter to "ACTIVE"
7. Observe further filtering
8. Click "Apply Filters" button
9. Change back to "All Departments"

**Expected Behavior:**
- [ ] Page loads with "All Departments" and "All Statuses" selected
- [ ] Filter change triggers API call or data refresh
- [ ] Job count updates based on filters
- [ ] Jobs displayed match selected filters
- [ ] Correct filtered data displayed

**Filter Fields:**
- [ ] Department: dropdown with all departments listed
- [ ] Status: dropdown with DRAFT, SUBMITTED, ACTIVE options
- [ ] Sort By: dropdown with options (Most Recent, Job Title)
- [ ] Apply Filters: button to trigger refresh

**Log Results:**
- Filters appear: YES / NO
- Data updates on filter change: YES / NO
- Correct filtered data displayed: YES / NO
- Status: PASS / FAIL

---

### Test 5: Detail Modal Display ✅ IMPLEMENTATION

**Objective:** Verify detail modal shows complete job information

**Steps:**
1. Login as hr@company.com
2. On /jobs page, click any job card
3. Verify modal opens with full details

**Modal Content:**
- [ ] Job title displayed prominently
- [ ] Job code shown
- [ ] Department name shown
- [ ] Status badge displayed
- [ ] Created date shown
- [ ] Last updated date shown
- [ ] Created by (author) shown

**Evaluation Details Tab:**
- [ ] Evaluation method displayed (Point-Factor, Market-Based, etc.)
- [ ] Weighted criteria shown as list with percentages
- [ ] Each criterion shows name and weight %
- [ ] Total weight shown (should = 100%)
- [ ] Color coding for total weight (green if 100%, red if not)

**Point Scale Section:**
- [ ] Minimum points displayed
- [ ] Maximum points displayed
- [ ] Point scale range shown
- [ ] Visual representation (scale bar) shown

**Compliance Info:**
- [ ] Directive 2023/970 reference shown
- [ ] Compliance message displayed

**Modal Actions:**
- [ ] Close button (X) closes modal
- [ ] Edit button visible (if status = DRAFT and user is HR)
- [ ] Print button opens print dialog
- [ ] Modal can be closed by clicking outside (if configured)

**Log Results:**
- Modal displays: YES / NO
- All details present: YES / NO
- Close functionality works: YES / NO
- Status: PASS / FAIL

---

### Test 6: Job Creation Wizard - Step 1 (Basic Info) ✅ IMPLEMENTATION

**Objective:** Verify first step of job creation form

**Steps:**
1. Login as hr@company.com
2. On /jobs page, click "Create Job" button
3. Verify redirect to /jobs/create
4. Verify Step 1 form displays

**Step 1 Fields:**
- [ ] Job Code input field
- [ ] Job Title input field
- [ ] Department dropdown (all options available)
- [ ] Evaluation Method dropdown (Point-Factor, Market-Based, Job Ranking, Factor Comparison)
- [ ] Description textarea

**Step 1 Validation:**
- [ ] "Next" button disabled if Job Code empty
- [ ] "Next" button disabled if Job Title empty
- [ ] "Next" button disabled if Department empty
- [ ] Errors display when trying to proceed without required fields
- [ ] "Cancel" button returns to /jobs
- [ ] Step indicator shows "1 of 4" or similar

**Log Results:**
- All fields present: YES / NO
- Validation working: YES / NO
- Navigation working: YES / NO
- Status: PASS / FAIL

---

### Test 7: Job Creation Wizard - Step 2 (Criteria) ✅ IMPLEMENTATION

**Objective:** Verify evaluation criteria step

**Steps:**
1. From Step 1, fill required fields
2. Click "Next" to go to Step 2
3. Verify criteria form displays

**Step 2 Criteria:**
- [ ] Shows default 4 criteria fields:
  - [ ] Education & Skills
  - [ ] Experience
  - [ ] Complexity
  - [ ] Accountability
- [ ] Each criterion can be edited/renamed
- [ ] Weight input for each criterion (0-100%)
- [ ] Live weight percentage display
- [ ] Total weight shown and updated in real-time

**Step 2 Validation:**
- [ ] "Next" button disabled if total weight ≠ 100%
- [ ] "Next" enabled when total weight = 100%
- [ ] Error message shows required weight adjustment
- [ ] Error message shows required adjust amount
- [ ] "Back" button returns to Step 1
- [ ] All entered data from Step 1 preserved
- [ ] Step indicator shows "2 of 4"

**Log Results:**
- Criteria fields display: YES / NO
- Weight validation working: YES / NO
- Real-time calculation correct: YES / NO
- Status: PASS / FAIL

---

### Test 8: Job Creation Wizard - Step 3 (Point Scale) ✅ IMPLEMENTATION

**Objective:** Verify point scale configuration step

**Steps:**
1. From Step 2, set weights that sum to 100%
2. Click "Next" to go to Step 3
3. Verify point scale form displays

**Step 3 Fields:**
- [ ] Minimum Points input (default 100)
- [ ] Maximum Points input (default 300)
- [ ] Visual scale bar showing min-max range
- [ ] Range calculation shown (max - min = X points)

**Step 3 Validation:**
- [ ] Minimum Points must be ≥ 0
- [ ] Maximum Points must be > Minimum Points
- [ ] "Next" disabled if validation fails
- [ ] "Next" enabled when valid
- [ ] Error message displays for invalid inputs
- [ ] "Back" button returns to Step 2
- [ ] All previous data preserved
- [ ] Step indicator shows "3 of 4"

**Point Scale Info:**
- [ ] Guidance text explains point scale usage
- [ ] Example ranges shown
- [ ] Explanation of how points relate to job evaluation

**Log Results:**
- Point scale fields display: YES / NO
- Validation working: YES / NO
- Range calculation correct: YES / NO
- Status: PASS / FAIL

---

### Test 9: Job Creation Wizard - Step 4 (Review) ✅ IMPLEMENTATION

**Objective:** Verify review/summary step

**Steps:**
1. From Step 3, set valid point scale
2. Click "Next"/"Review" to go to Step 4
3. Verify summary displays all entered information

**Review Content:**
- [ ] Basic Info card shows:
  - [ ] Job Code
  - [ ] Job Title
  - [ ] Department
  - [ ] Evaluation Method
- [ ] Point Scale card shows:
  - [ ] Minimum Points
  - [ ] Maximum Points
  - [ ] Range calculation
- [ ] Evaluation Criteria section shows:
  - [ ] All criteria with weights
  - [ ] Total weight (should = 100%)
- [ ] Description (if provided) displayed
- [ ] All values are read-only (not editable)

**Step 4 Actions:**
- [ ] "Back" button returns to Step 3, allowing edits
- [ ] "Create Job" button submits form
- [ ] All data from previous steps preserved
- [ ] Step indicator shows "4 of 4"

**Compliance Info:**
- [ ] Directive 2023/970 compliance message shown
- [ ] Next steps explanation provided

**Log Results:**
- All information displays correctly: YES / NO
- No data is lost: YES / NO
- Navigation works: YES / NO
- Status: PASS / FAIL

---

### Test 10: Job Creation Submission & Success ✅ IMPLEMENTATION

**Objective:** Verify job creation submission and success state

**Steps:**
1. From Step 4 Review, click "Create Job"
2. Observe loading state
3. Wait for success response

**Submission Behavior:**
- [ ] "Create Job" button becomes disabled during submission
- [ ] Loading indicator shows (spinner, "Creating..." text)
- [ ] API call to POST /api/jobs sent with form data
- [ ] Bearer token included in request

**Success State:**
- [ ] Success page displays with checkmark (✓)
- [ ] Confirms "Job Created Successfully"
- [ ] Shows Job ID (e.g., "JOB-001")
- [ ] Shows Job Title
- [ ] Status = DRAFT initially
- [ ] Message explains next steps
- [ ] "Back to Jobs" button returns to /jobs list
- [ ] "Edit Job Evaluation" button allows editing this job
- [ ] Newly created job appears in list with DRAFT status

**Data Persistence:**
- [ ] All job data saved correctly
- [ ] Job appears in list immediately or after refresh
- [ ] Status is DRAFT (can be edited)
- [ ] All criteria weights and point scale saved

**Log Results:**
- Submission successful: YES / NO
- Success page displays: YES / NO
- Data saved correctly: YES / NO
- Status: PASS / FAIL

---

### Test 11: Error Handling ✅ IMPLEMENTATION

**Objective:** Verify error display during job creation

**Setup:**
1. Simulate API failure (disable network or mock error response)
2. Start job creation process
3. Fill all required fields
4. Attempt to submit on Step 4

**Expected Error Handling:**
- [ ] Error alert displays with icon
- [ ] Shows translation key `errors.jobCreationFailed`
- [ ] Fallback message: "Failed to create job"
- [ ] Error details displayed
- [ ] Form remains on current step
- [ ] User can edit and retry
- [ ] "Back" button still works
- [ ] No data loss on error

**Recovery Test:**
- [ ] Enable network/restore API
- [ ] Click "Create Job" again
- [ ] Job creation succeeds
- [ ] Error alert disappears
- [ ] Success page displays

**Log Results:**
- Error displayed: YES / NO
- User can recover: YES / NO
- No data loss: YES / NO
- Status: PASS / FAIL

---

### Test 12: Loading States ✅ IMPLEMENTATION

**Objective:** Verify loading indicators display correctly

**Steps:**
1. Clear browser cache
2. Login as hr@company.com
3. Open /jobs page
4. Immediately watch for loading state
5. Navigate to /jobs/create
6. Watch for loading state on submission

**Expected Loading Behavior:**
- [ ] Jobs list shows loading indicator while fetching
- [ ] Shows spinner icon and "Searching..." text
- [ ] Loading state persists for at least 0.5 seconds
- [ ] Once data loads, indicator disappears
- [ ] Jobs display without layout shift
- [ ] Time to display: < 3 seconds
- [ ] During job creation, "Creating..." text shows on button
- [ ] Button disabled during submission

**Smooth Transition:**
- [ ] No visual jitter
- [ ] Content appears smoothly
- [ ] No content flashing

**Log Results:**
- Loading indicator visible: YES / NO
- Display smooth: YES / NO
- Data loads within 3s: YES / NO
- Status: PASS / FAIL

---

### Test 13: Mobile Responsiveness ✅ IMPLEMENTATION

**Objective:** Verify jobs pages display correctly on mobile

**Setup:**
1. Open jobs in Chrome
2. Open DevTools (F12)
3. Toggle device toolbar (Cmd+Shift+M)
4. Select iPhone 12 Pro (390 x 844)

**Mobile Layout Checks - Jobs List:**
- [ ] Page title visible and readable
- [ ] Job cards stack vertically (1 column)
- [ ] Filters stack vertically
- [ ] All text readable without zoom
- [ ] No horizontal scrolling
- [ ] Status badges visible
- [ ] Edit/action buttons touch-friendly (44x44px minimum)

**Mobile Layout Checks - Job Creation:**
- [ ] Form fields stack vertically
- [ ] Step indicator responsive
- [ ] Input fields full width
- [ ] Buttons touch-friendly
- [ ] Criteria inputs stacked
- [ ] All content scrollable
- [ ] No horizontal scrolling

**Responsive Breakpoints:**
- [ ] `grid-cols-1 md:grid-cols-2` on filters
- [ ] `grid-cols-1 md:grid-cols-2` on form fields
- [ ] Modal centered and scrollable on mobile

**Log Results:**
- Single column on mobile: YES / NO
- All content visible: YES / NO
- Touch targets adequate: YES / NO
- Status: PASS / FAIL

---

### Test 14: Accessibility Testing ✅ IMPLEMENTATION

**Objective:** Verify accessibility compliance

**Keyboard Navigation:**
- [ ] Tab key navigates through filter controls
- [ ] Tab key navigates through form fields
- [ ] Tab navigates to all action buttons
- [ ] Focus visible on each element
- [ ] Tab order is logical
- [ ] Enter/Space triggers buttons

**Screen Reader:**
- [ ] Page title announced
- [ ] Each job card announced with title and status
- [ ] Step labels announced during creation
- [ ] Form field labels associated with inputs (htmlFor/id)
- [ ] Error messages announced
- [ ] Filter labels associated with selects

**Color Contrast:**
- [ ] Text readable on backgrounds
- [ ] Badge colors sufficient contrast
- [ ] Status badges (green/yellow/blue) have sufficient contrast
- [ ] Not sole indicator of status (text label also shown)

**Semantic HTML:**
- [ ] Proper heading hierarchy (h1, h2, h3)
- [ ] Form elements properly structured
- [ ] Button elements used for actions
- [ ] Links use <a> tags

**Status:** ✅ IMPLEMENTATION (Semantic HTML used throughout)

**Log Results:**
- Keyboard navigation works: YES / NO
- Screen reader friendly: YES / NO
- Color contrast adequate: YES / NO
- Status: PASS / FAIL

---

### Test 15: Language Support ✅ IMPLEMENTATION

**Objective:** Verify multilingual support

**Translation Keys Used:**
- [ ] `jobs.title` - Page title
- [ ] `jobs.description` - Page description
- [ ] `jobs.create` - Create button
- [ ] `jobs.filtersAndSorting` - Filter section header
- [ ] `jobs.department`, `jobs.status`, `jobs.sortBy` - Filter labels
- [ ] `jobs.draft`, `jobs.submitted`, `jobs.active` - Status labels
- [ ] `jobs.jobCount` - Job count text
- [ ] `jobs.created`, `jobs.lastUpdated`, `jobs.evaluationMethod` - Job details
- [ ] `jobs.pointScale` - Point scale label
- [ ] All form labels and error messages
- [ ] All button labels
- [ ] All validation messages

**Language Switching:**
- [ ] All text uses translation function
- [ ] No hardcoded strings
- [ ] Supports dynamic language switching
- [ ] Translations exist for Romanian (ro) and English (en)

**Log Results:**
- All text translated: YES / NO
- Language switching works: YES / NO
- Status: PASS / FAIL

---

### Test 16: Edit Job (DRAFT Status Only) ✅ IMPLEMENTATION

**Objective:** Verify draft jobs can be edited

**Steps:**
1. Login as hr@company.com
2. Find a job with status = DRAFT
3. Click Edit button (or click job and click Edit in modal)
4. Verify redirected to edit form
5. Verify all fields pre-populated
6. Modify a field
7. Complete wizard and submit changes

**Expected Behavior:**
- [ ] Edit button visible only for DRAFT jobs
- [ ] Edit navigates to /jobs/{id}/edit or pre-fills form
- [ ] All fields pre-populated with current values
- [ ] Can edit any field
- [ ] Weights can be re-balanced
- [ ] Point scale can be changed
- [ ] Submission updates the job
- [ ] Success page shows updated job ID
- [ ] Changes appear in list

**Submitted/Active Jobs:**
- [ ] Edit button NOT visible for SUBMITTED jobs (only Activate)
- [ ] Edit button NOT visible for ACTIVE jobs
- [ ] COMPLIANCE_OFFICER can Activate SUBMITTED jobs

**Log Results:**
- Edit works for DRAFT: YES / NO
- Pre-population correct: YES / NO
- Changes saved: YES / NO
- Status: PASS / FAIL

---

### Test 17: Action Buttons & Navigation ✅ IMPLEMENTATION

**Objective:** Verify action buttons work correctly

**Create Button:**
- [ ] Visible to HR_SPECIALIST and ADMIN
- [ ] Navigates to /jobs/create
- [ ] Not visible to COMPLIANCE_OFFICER
- [ ] Not visible to MANAGER or EMPLOYEE

**Edit Button:**
- [ ] Visible only for DRAFT status jobs
- [ ] Only visible to HR_SPECIALIST and ADMIN
- [ ] Navigates to /jobs/{id}/edit
- [ ] Pre-populates form with current data

**Activate Button (for SUBMITTED jobs):**
- [ ] Visible only for SUBMITTED status jobs
- [ ] Only visible to COMPLIANCE_OFFICER and ADMIN
- [ ] Changes job status to ACTIVE
- [ ] Job moves out of SUBMITTED list

**Print Button:**
- [ ] Available in detail modal
- [ ] Opens browser print dialog
- [ ] Prints job details in readable format

**Log Results:**
- All buttons appear correctly: YES / NO
- Navigation works: YES / NO
- Permissions enforced: YES / NO
- Status: PASS / FAIL

---

### Test 18: Data Consistency ✅ IMPLEMENTATION

**Objective:** Verify data remains consistent

**Steps:**
1. Create a new job with specific values
2. View in list (note status = DRAFT)
3. View in detail modal
4. Edit the job, change some values
5. Navigate away and back
6. Verify values consistent

**Expected Behavior:**
- [ ] Job data matches API response
- [ ] No data corruption on edit
- [ ] Re-navigation returns same data
- [ ] All criteria weights add to 100%
- [ ] Point scale values consistent
- [ ] Status unchanged unless specifically updated
- [ ] Timestamps match creation/update times

**Calculation Validation:**
- [ ] Weight percentages sum correctly
- [ ] Point scale range calculated correctly (max - min)
- [ ] Job counts in list accurate

**Log Results:**
- Data consistent: YES / NO
- No race conditions: YES / NO
- Status: PASS / FAIL

---

## Test Execution Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1. Authorization | PASS / FAIL | |
| 2. Hook Integration | PASS / FAIL | |
| 3. Jobs List Display | PASS / FAIL | |
| 4. Filters & Refresh | PASS / FAIL | |
| 5. Detail Modal | PASS / FAIL | |
| 6. Step 1 - Basic Info | PASS / FAIL | |
| 7. Step 2 - Criteria | PASS / FAIL | |
| 8. Step 3 - Point Scale | PASS / FAIL | |
| 9. Step 4 - Review | PASS / FAIL | |
| 10. Submission & Success | PASS / FAIL | |
| 11. Error Handling | PASS / FAIL | |
| 12. Loading States | PASS / FAIL | |
| 13. Mobile Responsiveness | PASS / FAIL | |
| 14. Accessibility | PASS / FAIL | |
| 15. Language Support | PASS / FAIL | |
| 16. Edit Job | PASS / FAIL | |
| 17. Action Buttons | PASS / FAIL | |
| 18. Data Consistency | PASS / FAIL | |

**Overall Status:** PASS / FAIL / PARTIAL

---

## Issues Found

### Critical (Blocks Testing)
1. _______________
2. _______________

### High (Major Feature Impact)
1. _______________
2. _______________

### Medium (Minor Feature Impact)
1. _______________
2. _______________

### Low (Polish/Nice-to-Have)
1. _______________
2. _______________

---

## Sign-Off

- **Tested By:** _________________ **Date:** __________
- **Reviewed By:** _________________ **Date:** __________
- **Approved For Phase 1d:** _________________ **Date:** __________

---

## Notes

___________________________________________________________________

___________________________________________________________________

___________________________________________________________________

---

**Next Step:** If all tests PASS, proceed to Phase 1d (Justifications Workflow Integration)

**Last Updated:** 2026-05-14  
**Estimated Testing Time:** 2-3 hours
