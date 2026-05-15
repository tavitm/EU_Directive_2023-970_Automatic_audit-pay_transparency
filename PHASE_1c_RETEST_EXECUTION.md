# Phase 1c Re-Test Execution - Jobs Management Integration

**Date:** 2026-05-14  
**Purpose:** Verify all fixes are working correctly  
**Focus:** Critical Tests 6-10 (Job Creation Wizard) + Modal Accessibility

---

## Re-Test Plan

### Critical Fixes to Verify

1. **Description Field Validation Fix**
   - Location: `/pages/jobs/create.tsx` lines 110-112
   - Expected: Form requires description field; validation error shown if empty
   - Test: Proceed through wizard without description → should fail at review step

2. **API Payload Transformation Fix**
   - Location: `/hooks/useApi.ts` lines 185-219
   - Expected: Form data mapped to API schema (department→jobGroup, calculated pointValue)
   - Test: Submit job → verify success response

3. **Modal Accessibility Fix**
   - Location: `/pages/jobs/index.tsx` lines 314-419
   - Expected: Modal has proper ARIA attributes (role, aria-modal, aria-labelledby, aria-label)
   - Test: Open job detail modal → verify ARIA attributes present

---

## Test 6: Job Creation Wizard Access

**Status:** ✅ EXPECTED PASS

**Verification:**
- Navigate to /jobs/create
- Verify multi-step wizard UI displays
- Verify step indicator shows (1) Basic Info, (2) Criteria, (3) Point Scale, (4) Review

---

## Test 7: Basic Information Step

**Status:** ✅ EXPECTED PASS

**Verification:**
- Fill in: Job Code, Title, Department
- **NEW:** Fill in Description field (was optional before, now required)
- Verify no errors when all fields filled
- Click Next → advance to step 2

---

## Test 8: Evaluation Method Step

**Status:** ✅ EXPECTED PASS

**Verification:**
- Verify default criteria display (Education & Skills, Experience, Complexity, Accountability)
- Verify weight input fields available
- Click Next → advance to step 3

---

## Test 9: Weighted Criteria Step

**Status:** ✅ EXPECTED PASS

**Verification:**
- Verify point scale inputs display
- Enter: Min = 100, Max = 500
- Verify validation: Max > Min
- Click Next → advance to step 4 (Review)

---

## Test 10: Review & Submit (CRITICAL - BLOCKER FIX)

**Status:** ✅ EXPECTED PASS (Previously BLOCKER)

**What Changed:**
- Description field now required in validation
- Form data transformed to API schema before submission
- API payload includes all required fields

**Verification Steps:**

### Step 10a: Verify Description Field Retained
- Navigate through all steps (Basic → Criteria → Scale → Review)
- On Review page, scroll down to view all job details
- **VERIFY:** Description field from Step 1 is displayed
- **EXPECTED:** See the description text you entered

### Step 10b: Verify Complete Data in Review
- Check all displayed fields:
  - Job Code ✓
  - Title ✓
  - Department ✓
  - Description ✓
  - Evaluation Method ✓
  - Weighted Criteria with correct weights ✓
  - Point Scale (Min/Max) ✓

### Step 10c: Submit and Verify Success
- Click "Crear" / "Create" button
- **EXPECTED:** Success message: "Evaluation de poste creado exitosamente" or "Job evaluation created successfully"
- **EXPECTED:** Redirect to created job success page
- **VERIFY:** New job appears in jobs list with DRAFT status

---

## Test 14: Modal Accessibility (MEDIUM FIX)

**Status:** ✅ EXPECTED PASS (Previously MIXED)

**What Changed:**
- Modal now has proper ARIA semantic attributes
- Modal container: `role="dialog" aria-modal="true" aria-labelledby="job-detail-title"`
- Modal title: `id="job-detail-title"`
- Close button: `aria-label="Close job details modal"`

**Verification Steps:**

### Step 14a: Open Job Detail Modal
- Navigate to /jobs
- Click any job card to open detail modal
- **VERIFY:** Modal displays without errors

### Step 14b: Check ARIA Attributes (Browser DevTools)
- Right-click on modal container
- Select "Inspect" to open DevTools
- **VERIFY ATTRIBUTES:**
  - `role="dialog"` present on modal div
  - `aria-modal="true"` present
  - `aria-labelledby="job-detail-title"` present
  - Modal title has `id="job-detail-title"`
  - Close button has `aria-label="Close job details modal"`

### Step 14c: Keyboard Navigation
- Close modal (press Escape or click close button)
- Open modal again
- **VERIFY:** Tab key focuses through modal content
- **VERIFY:** Can close with Escape key
- **VERIFY:** Focus returns to page after modal closes

### Step 14d: Screen Reader Test (Optional)
- If screen reader available: verify modal is announced as dialog
- Verify modal title is read when opened
- Verify close button is properly announced

---

## Test 4 Re-validation: Filter Department

**Current Status:** ⚠️ PARTIAL (Department filter mismatch)

**Issue:** Dropdown shows "Engineering" but jobs use "Developers"/"Managers"

**Recommendation:** Update job data to use "Engineering" value
- Re-create test jobs using "Engineering" department
- Then re-test filter

---

## Execution Checklist

### Pre-Test Verification
- [ ] Navigate to http://localhost:3000/jobs
- [ ] Verify page loads without console errors
- [ ] Verify at least 3 sample jobs display
- [ ] Verify user has HR_SPECIALIST or ADMIN role

### Test Execution Order
1. [ ] Test 10: Review & Submit (Job Creation)
   - [ ] 10a: Description field retained through wizard
   - [ ] 10b: Complete data displayed in review
   - [ ] 10c: Successful submission and success message
2. [ ] Test 14: Modal Accessibility
   - [ ] 14a: Modal displays and opens correctly
   - [ ] 14b: ARIA attributes verified in DevTools
   - [ ] 14c: Keyboard navigation works
   - [ ] 14d: Escape key closes modal

### Post-Test Verification
- [ ] Check browser console for errors (should be none)
- [ ] Verify newly created job appears in jobs list
- [ ] Verify job shows DRAFT status
- [ ] All tests pass or document any new issues

---

## Expected Outcomes

### Success Criteria

| Test | Criteria | Expected Result |
|------|----------|-----------------|
| 10 | Job creation succeeds | New job created with DRAFT status |
| 10 | Description persisted | Description displays in review and confirmation |
| 14 | ARIA attributes present | All role, aria-modal, aria-labelledby, aria-label attributes |
| 14 | Keyboard accessible | Tab/Escape navigation works, focus management correct |

### Test Results Template

```
Test Status: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

Test 10: Review & Submit
- 10a Description retained: [PASS/FAIL] Notes: ___
- 10b Complete data displayed: [PASS/FAIL] Notes: ___
- 10c Successful submission: [PASS/FAIL] Notes: ___

Test 14: Modal Accessibility
- 14a Modal opens correctly: [PASS/FAIL] Notes: ___
- 14b ARIA attributes present: [PASS/FAIL] Notes: ___
- 14c Keyboard navigation works: [PASS/FAIL] Notes: ___
- 14d Escape closes modal: [PASS/FAIL] Notes: ___
```

---

## Sign-Off

**Re-Test Status:** Ready for execution

**Fixes Applied:**
1. ✅ Description field validation (required)
2. ✅ API payload transformation (department→jobGroup mapping)
3. ✅ Modal ARIA attributes (role, aria-modal, aria-labelledby, aria-label)

**Next Steps After Re-Test:**
- If all tests PASS: Declare Phase 1c COMPLETE
- If any tests FAIL: Document new issues and apply additional fixes
- Proceed to Phase 1d (Justifications Workflow)

---

**Test Plan Created:** 2026-05-14  
**Target:** Critical Path Verification  
**Scope:** Tests 6-10 (Wizard) + Test 14 (Accessibility)

