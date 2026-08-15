# Requirements Document: Profile Fields Read-Only

## 1. Introduction

### 1.1 Purpose
This document specifies the requirements for converting most profile fields in the Customer Profile page to read-only mode, allowing users to view but not modify their registration data after account creation.

### 1.2 Scope
This feature applies to the Customer Profile page (`frontend/src/pages/customer/Profile.jsx`) and affects how users interact with their profile information stored in localStorage.

### 1.3 Background
Currently, all profile fields are editable, allowing users to modify critical registration information such as name, mobile number, email, age, gender, blood group, and emergency contact details. This creates data integrity concerns as these fields should remain immutable after initial registration.

### 1.4 Objectives
- Prevent modification of critical profile fields after initial data entry
- Maintain data integrity for emergency and medical information
- Keep password field editable for security updates
- Provide clear visual indication of read-only fields

---

## 2. User Stories

### US-1: View Immutable Profile Information
**As a** registered customer  
**I want** to view my profile information without being able to edit most fields  
**So that** my critical registration data remains consistent and cannot be accidentally modified

**Acceptance Criteria:**
- I can view all my profile information on the profile page
- Read-only fields display my saved data clearly
- I understand which fields are editable vs read-only through visual cues

### US-2: Update Password Only
**As a** registered customer  
**I want** to change my password while keeping other fields locked  
**So that** I can maintain account security without risking data integrity

**Acceptance Criteria:**
- Password field remains fully editable
- I can update my password and save it
- Password changes do not affect read-only field states

### US-3: Recognize Read-Only Fields
**As a** registered customer  
**I want** clear visual indication of which fields cannot be edited  
**So that** I don't waste time trying to modify locked fields

**Acceptance Criteria:**
- Read-only fields have distinct visual styling (e.g., disabled appearance)
- Attempting to interact with read-only fields provides clear feedback
- Visual distinction is consistent with the existing glassmorphic design

---

## 3. Functional Requirements

### FR-1: Read-Only Field Implementation

#### FR-1.1: Make Fields Read-Only
**Description:** Convert specified profile fields to read-only mode

**Fields to Make Read-Only:**
1. Full Name
2. Mobile Number
3. Email Address
4. Age
5. Gender
6. Blood Group
7. Emergency Contact Name
8. Emergency Contact Number

**Acceptance Criteria:**
- **AC-1.1.1:** When the profile page loads with existing user data in localStorage, the eight specified fields are rendered as read-only
- **AC-1.1.2:** Read-only fields display the saved values from localStorage
- **AC-1.1.3:** Users cannot modify text in read-only input fields via keyboard input
- **AC-1.1.4:** Users cannot modify read-only select dropdown values
- **AC-1.1.5:** Read-only fields do not trigger onChange handlers
- **AC-1.1.6:** Clicking or focusing on read-only fields does not enable editing

#### FR-1.2: Keep Password Editable
**Description:** Password field remains fully editable

**Acceptance Criteria:**
- **AC-1.2.1:** Password field accepts keyboard input
- **AC-1.2.2:** Password field onChange handler functions normally
- **AC-1.2.3:** Password visibility toggle button works correctly
- **AC-1.2.4:** Password field has the same interactive styling as current implementation

### FR-2: Visual Indication

#### FR-2.1: Read-Only Field Styling
**Description:** Apply distinct visual styling to read-only fields

**Acceptance Criteria:**
- **AC-2.1.1:** Read-only input fields have reduced opacity (e.g., 0.6-0.7)
- **AC-2.1.2:** Read-only fields show a "not-allowed" cursor on hover
- **AC-2.1.3:** Read-only fields use a muted background color (e.g., rgba(255,255,255,0.02))
- **AC-2.1.4:** Read-only field labels include a visual indicator (e.g., 🔒 lock icon)
- **AC-2.1.5:** Border styling differentiates read-only from editable fields
- **AC-2.1.6:** Focus states are disabled for read-only fields

#### FR-2.2: Editable Field Distinction
**Description:** Ensure editable fields remain visually distinct

**Acceptance Criteria:**
- **AC-2.2.1:** Password field retains full interactive styling
- **AC-2.2.2:** Password field has normal opacity (1.0)
- **AC-2.2.3:** Password field shows pointer cursor on hover
- **AC-2.2.4:** Password field label does not show lock icon

### FR-3: Form Behavior

#### FR-3.1: Save Button Behavior
**Description:** Adjust save button to handle read-only fields appropriately

**Acceptance Criteria:**
- **AC-3.1.1:** Save button remains functional for updating password
- **AC-3.1.2:** Saving the form updates only editable fields (password) in localStorage
- **AC-3.1.3:** Read-only field values are preserved during save operation
- **AC-3.1.4:** Success message displays after successful save
- **AC-3.1.5:** Save button is disabled during save operation (existing behavior maintained)

#### FR-3.2: Data Persistence
**Description:** Ensure localStorage data integrity with read-only fields

**Acceptance Criteria:**
- **AC-3.2.1:** Read-only field values are never modified in localStorage after initial entry
- **AC-3.2.2:** Password updates are correctly saved to localStorage (if password is stored)
- **AC-3.2.3:** Form submission does not overwrite read-only data with empty values
- **AC-3.2.4:** Page reload correctly restores all read-only field values

### FR-4: Component Updates

#### FR-4.1: GlassInput Component Enhancement
**Description:** Extend GlassInput component to support read-only mode

**Acceptance Criteria:**
- **AC-4.1.1:** GlassInput accepts a `readOnly` boolean prop
- **AC-4.1.2:** When readOnly=true, input element has `readOnly` attribute set
- **AC-4.1.3:** When readOnly=true, input applies read-only styling
- **AC-4.1.4:** When readOnly=true, focus state changes are disabled
- **AC-4.1.5:** Label displays lock icon when readOnly=true

#### FR-4.2: GlassSelect Component Enhancement
**Description:** Extend GlassSelect component to support read-only mode

**Acceptance Criteria:**
- **AC-4.2.1:** GlassSelect accepts a `readOnly` boolean prop
- **AC-4.2.2:** When readOnly=true, select element has `disabled` attribute set
- **AC-4.2.3:** When readOnly=true, dropdown arrow is hidden or dimmed
- **AC-4.2.4:** When readOnly=true, select applies read-only styling
- **AC-4.2.5:** Label displays lock icon when readOnly=true

---

## 4. Non-Functional Requirements

### NFR-1: Usability
- **NFR-1.1:** Users should immediately recognize read-only fields within 2 seconds of viewing the page
- **NFR-1.2:** Visual distinction between read-only and editable fields must be obvious without requiring color perception (accessibility)
- **NFR-1.3:** Read-only fields must maintain readability with sufficient contrast ratios

### NFR-2: Performance
- **NFR-2.1:** Adding read-only functionality should not increase page load time by more than 50ms
- **NFR-2.2:** Form save operation should complete within existing timeout (1200ms simulation)

### NFR-3: Maintainability
- **NFR-3.1:** Read-only logic should be implemented through reusable component props
- **NFR-3.2:** Styling changes should use consistent design tokens with existing glassmorphic theme
- **NFR-3.3:** Code changes should not duplicate existing component logic

### NFR-4: Compatibility
- **NFR-4.1:** Read-only functionality must work in all browsers that support the current application
- **NFR-4.2:** Feature must maintain compatibility with existing localStorage data structure
- **NFR-4.3:** Changes must not break existing form validation or submission logic

### NFR-5: Accessibility
- **NFR-5.1:** Read-only input fields must have `aria-readonly="true"` attribute
- **NFR-5.2:** Disabled select fields must have `aria-disabled="true"` attribute
- **NFR-5.3:** Screen readers must announce fields as read-only or disabled
- **NFR-5.4:** Keyboard navigation should skip read-only fields appropriately

---

## 5. Dependencies and Constraints

### 5.1 Technical Dependencies
- **React:** Existing component structure using React hooks (useState)
- **Framer Motion:** Animation library for transitions (already in use)
- **localStorage:** Client-side storage with key 'resq_user'
- **CustomerLayout:** Parent layout component

### 5.2 Data Dependencies
- **localStorage Key:** 'resq_user' must contain user profile data
- **Data Structure:** JSON object with fields: fullName, mobile, email, age, gender, bloodGroup, ecName, ecNumber

### 5.3 Constraints

#### Technical Constraints
- **C-1:** Changes must maintain existing glassmorphic design aesthetic
- **C-2:** No backend API integration available; all data is localStorage-based
- **C-3:** Must preserve existing form submission behavior and animations
- **C-4:** Cannot add external dependencies or libraries

#### Business Constraints
- **C-5:** Once data is entered, it becomes immutable (no admin override feature required)
- **C-6:** No "unlock" or "edit mode" functionality needed
- **C-7:** No user notification about read-only policy required (implicit from UI)

#### Security Constraints
- **C-8:** Password field must remain editable for security best practices
- **C-9:** localStorage data can still be manually modified (browser limitation accepted)

### 5.4 Out of Scope
The following items are explicitly **NOT** included in this feature:
- Backend API for data validation or storage
- Admin interface for editing locked fields
- User notification/warning when trying to edit locked fields
- Request system for users to petition changes to read-only fields
- Audit log of field access or modification attempts
- Conditional read-only logic (e.g., unlock after verification)
- Field-level permissions or role-based access control
- Password strength validation
- Email/phone verification flow

---

## 6. Assumptions

1. Users have already entered their profile data during registration
2. The localStorage key 'resq_user' exists with valid JSON data
3. Users understand that profile fields shown are permanent
4. Password updates are acceptable as the only editable field
5. No legal or regulatory requirements mandate profile data editability
6. Emergency contact information changes would be handled through customer support (out of system)

---

## 7. Success Metrics

### Functional Success
- All eight specified fields are non-editable
- Password field remains editable
- Zero unintended data modifications in localStorage
- Form submission works correctly

### User Experience Success
- Users can visually identify read-only fields within 2 seconds
- No user confusion about why fields cannot be edited
- Consistent visual language with existing design system

---

## 8. Future Considerations

While out of scope for this implementation, the following may be considered for future iterations:

1. **Admin Override:** Allow administrators to unlock fields for legitimate user requests
2. **Change Request System:** Enable users to submit formal requests for profile data changes
3. **Verification-Based Unlock:** Allow editing after re-verification (email/SMS OTP)
4. **Audit Trail:** Log all view/edit attempts for security monitoring
5. **Partial Editability:** Some fields editable within time window (e.g., 24 hours after registration)
6. **Backend Integration:** Move to server-side data validation and storage
