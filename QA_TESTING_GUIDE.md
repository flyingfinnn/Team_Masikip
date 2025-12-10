# 🧪 QA Testing Guide - Ledgee Notes Application

**Project:** Team Masikip - Blockchain-Based Notes Application  
**Tester:** [Your Name]  
**Date:** December 10, 2025  
**Branch:** refined  
**Testing Environment:** Development

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Pre-Testing Setup](#pre-testing-setup)
3. [Frontend Testing](#frontend-testing)
4. [Backend API Testing](#backend-api-testing)
5. [Blockchain Integration Testing](#blockchain-integration-testing)
6. [Test Cases & Results](#test-cases--results)
7. [Bug Report Template](#bug-report-template)

---

## Overview

This guide covers comprehensive testing of the Ledgee application, which records every note operation (create, edit, delete, pin) as a transaction on the Cardano blockchain. The application consists of:

- **Frontend:** React-based UI with Vite
- **Backend:** Java Spring Boot REST API
- **Database:** PostgreSQL
- **Blockchain:** Cardano (via wallet integration)

---

## Pre-Testing Setup

### Environment Requirements

**Frontend Setup:**
```powershell
cd frontend
npm install
npm run dev
```
Expected: Development server starts at `http://localhost:5173`

**Backend Setup:**
```powershell
cd backend
# Ensure PostgreSQL is running on localhost:5432
# Database: notes_db
# User: postgres
# Password: postgres
.\mvnw spring-boot:run
```
Expected: API server starts at `http://localhost:8080`

**PostgreSQL Setup:**
```sql
-- Verify database connection
psql -U postgres -d notes_db
\dt  -- List tables (should show 'note' and 'note_transaction')
```

### Browser Requirements
- Chrome/Edge (recommended for Cardano wallet extensions)
- Install a Cardano wallet extension:
  - **Nami Wallet** (recommended)
  - **Eternl**
  - **Flint**
  - **Yoroi**

### Test Wallet Setup
- Switch wallet to **Preprod Testnet** (NOT Mainnet)
- Obtain test ADA from [Cardano Testnet Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/)
- Minimum 10 ADA recommended for testing

---

## Frontend Testing

### 1. Application Launch & Initial Load

| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| FE-001 | Application loads successfully | 1. Navigate to `http://localhost:5173` | App displays with Notes Gallery view | ⬜ | |
| FE-002 | No console errors on load | 1. Open DevTools (F12)<br>2. Check Console | No errors (warnings okay) | ⬜ | |
| FE-003 | Sidebar renders correctly | 1. Check left sidebar | Shows: Logo, Search, Wallet button, Note sections | ⬜ | |

---

### 2. Wallet Connection Testing

| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| FE-004 | Connect wallet button visible | 1. Look for "Connect Wallet" button | Button visible in sidebar and header | ⬜ | |
| FE-005 | Wallet connection flow | 1. Click "Connect Wallet"<br>2. Select wallet from modal<br>3. Approve in wallet extension | Button shows wallet name & truncated address | ⬜ | |
| FE-006 | Wallet disconnection | 1. Click connected wallet button<br>2. Select "Disconnect" | Wallet disconnects, button shows "Connect Wallet" | ⬜ | |
| FE-007 | Wallet address display | 1. Connect wallet<br>2. Hover over wallet button | Shows full address in tooltip | ⬜ | |
| FE-008 | Balance display | 1. Connect wallet<br>2. Navigate to Wallet page | Shows current ADA balance | ⬜ | |
| FE-009 | Multiple wallet support | 1. Disconnect wallet<br>2. Connect different wallet | Switches to new wallet successfully | ⬜ | |

---

### 3. Notes Gallery Testing

| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| FE-010 | Create new note button | 1. Click "Create Note" or "+" button | Opens note editor or modal | ⬜ | |
| FE-011 | Note card display | 1. Verify existing notes show | Each card shows: title, preview, priority, status pill, timestamp | ⬜ | |
| FE-012 | Search notes | 1. Type in search box<br>2. Enter query | Filters notes by title/content | ⬜ | |
| FE-013 | Sort notes | 1. Click sort dropdown<br>2. Select "Newest First" | Notes reorder by date descending | ⬜ | |
| FE-014 | Sort by priority | 1. Change sort to "Priority" | High → Medium → Low priority order | ⬜ | |
| FE-015 | Sort by created date | 1. Change sort to "Created" | Notes ordered by creation date | ⬜ | |
| FE-016 | Pinned notes section | 1. Pin a note<br>2. Check gallery | Pinned section appears at top | ⬜ | |
| FE-017 | Status pill display | 1. Check note cards | Each shows "PENDING" or "CONFIRMED" pill | ⬜ | Status pills should be color-coded |
| FE-018 | Empty state | 1. Delete all notes (or test with empty DB) | Shows "No notes" message | ⬜ | |

---

### 4. Note Editor Testing

| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| FE-019 | Create new note | 1. Click "Create Note"<br>2. Type content<br>3. Click Save | Note appears in gallery | ⬜ | |
| FE-020 | Edit existing note | 1. Click note card<br>2. Modify content<br>3. Auto-save triggers | Changes persist | ⬜ | |
| FE-021 | Note title extraction | 1. Create note with content<br>2. Save | First line becomes title | ⬜ | |
| FE-022 | Pin/Unpin note | 1. Open note<br>2. Click pin icon | Note moves to/from pinned section | ⬜ | |
| FE-023 | Set priority | 1. Open note<br>2. Change priority dropdown<br>3. Save | Priority updates on card | ⬜ | |
| FE-024 | Delete note | 1. Open note<br>2. Click delete button<br>3. Confirm | Note moves to trash | ⬜ | |
| FE-025 | Restore note from trash | 1. Go to trash<br>2. Open deleted note<br>3. Click restore | Note returns to main list | ⬜ | |
| FE-026 | Auto-save functionality | 1. Edit note<br>2. Wait 2 seconds | Saves automatically without button | ⬜ | |
| FE-027 | Character count display | 1. Type in editor | Shows character/word count | ⬜ | |
| FE-028 | Long content handling | 1. Paste 1000+ characters | Editor scrolls, no lag | ⬜ | |

---

### 5. Sidebar Navigation Testing

| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| FE-029 | Sidebar search | 1. Type in sidebar search | Filters notes in sidebar list | ⬜ | |
| FE-030 | Notes section expand/collapse | 1. Click "Notes" section header | Section toggles visibility | ⬜ | |
| FE-031 | Pinned section expand/collapse | 1. Click "Pinned Notes" section | Section toggles visibility | ⬜ | |
| FE-032 | Trash section expand/collapse | 1. Click "Trash" section | Section toggles visibility | ⬜ | |
| FE-033 | Note selection in sidebar | 1. Click note in sidebar | Opens note in editor | ⬜ | |
| FE-034 | Priority icons display | 1. Check notes in sidebar | 🔴 High, 🟡 Medium, 🟢 Low | ⬜ | |
| FE-035 | Status pills in sidebar | 1. Check note metadata | Shows PENDING/CONFIRMED status | ⬜ | |
| FE-036 | Back to gallery button | 1. Open note<br>2. Click back arrow | Returns to gallery view | ⬜ | |

---

### 6. Wallet Page Testing

| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| FE-037 | Navigate to wallet page | 1. Click Wallet tab/button | Shows wallet dashboard | ⬜ | |
| FE-038 | Balance display | 1. View wallet page | Shows: Available, Spent, Pending fees | ⬜ | |
| FE-039 | Transaction history loads | 1. Wait for transactions | Shows list of transactions | ⬜ | |
| FE-040 | Transaction search | 1. Type in search box<br>2. Enter tx ID or keyword | Filters transactions | ⬜ | |
| FE-041 | Transaction sorting | 1. Change sort dropdown | Reorders transactions | ⬜ | Newest/Oldest/Amount/Status/Action |
| FE-042 | Transaction details | 1. Check each transaction row | Shows: Action, Details, Amount, Status, Timestamp | ⬜ | |
| FE-043 | Transaction status display | 1. Check recent transactions | Shows "pending" or "confirmed" | ⬜ | |
| FE-044 | Cached transactions | 1. Switch to Wallet page<br>2. Switch to Notes<br>3. Return to Wallet | No loading flash, instant display | ⬜ | |
| FE-045 | Refresh transaction history | 1. Wait for new transaction<br>2. Check if appears | Auto-updates or refresh button works | ⬜ | |
| FE-046 | Empty transaction state | 1. Test with wallet with no transactions | Shows appropriate message | ⬜ | |

---

### 7. Blockchain Status Display Testing

| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| FE-047 | New note shows pending | 1. Create note<br>2. Save to blockchain<br>3. Check status pill immediately | Shows "PENDING" | ⬜ | |
| FE-048 | Status changes to confirmed | 1. Wait 2-5 minutes after save<br>2. Refresh or check status | Changes to "CONFIRMED" | ⬜ | |
| FE-049 | Status pill colors | 1. Check various notes | Pending = yellow/orange, Confirmed = green | ⬜ | Check CSS |
| FE-050 | Status in gallery view | 1. View notes gallery | All cards show status pills | ⬜ | |
| FE-051 | Status in sidebar | 1. Check sidebar notes | All show status pills | ⬜ | |
| FE-052 | Status updates on refresh | 1. Reload page | Statuses persist correctly | ⬜ | |

---

### 8. Metadata Chunking Testing

| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| FE-053 | Small note (< 200 chars) | 1. Create note with 100 characters<br>2. Save to blockchain<br>3. Check DevTools Network tab | Metadata sent as single string | ⬜ | |
| FE-054 | Medium note (200-500 chars) | 1. Create note with 300 characters<br>2. Save to blockchain<br>3. Check metadata payload | Chunked into 2 parts | ⬜ | |
| FE-055 | Large note (> 1000 chars) | 1. Paste 1500 character content<br>2. Save to blockchain<br>3. Verify transaction succeeds | Chunked appropriately, no errors | ⬜ | |
| FE-056 | Chunking log verification | 1. Create large note<br>2. Check Console logs | Shows "Metadata attached (chunked)" | ⬜ | |
| FE-057 | Title chunking | 1. Create note with 250+ char title<br>2. Save | Title is chunked | ⬜ | |
| FE-058 | Content retrieval after chunk | 1. Save chunked note<br>2. Reload page<br>3. Open note | Full content displays correctly | ⬜ | |

---

### 9. UI/UX Testing

| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| FE-059 | Responsive design - Desktop | 1. Test at 1920x1080 | Layout looks good | ⬜ | |
| FE-060 | Responsive design - Tablet | 1. Resize to 768px width | Adapts appropriately | ⬜ | |
| FE-061 | Responsive design - Mobile | 1. Resize to 375px width | Sidebar collapses, touch-friendly | ⬜ | |
| FE-062 | Theme/Colors | 1. Check overall appearance | Consistent color scheme | ⬜ | |
| FE-063 | Loading states | 1. Trigger actions that load data | Shows spinners/loaders | ⬜ | |
| FE-064 | Error messages | 1. Disconnect internet<br>2. Try creating note | Shows user-friendly error | ⬜ | |
| FE-065 | Toast notifications | 1. Perform various actions | Shows success/error toasts | ⬜ | |
| FE-066 | Button hover states | 1. Hover over buttons | Visual feedback (color change, etc.) | ⬜ | |
| FE-067 | Keyboard navigation | 1. Use Tab key to navigate | Focus indicators visible | ⬜ | |
| FE-068 | Accessibility | 1. Use screen reader | Proper labels and ARIA attributes | ⬜ | |

---

## Backend API Testing

### 10. API Endpoints Testing

**Base URL:** `http://localhost:8080/api`

| Test ID | Endpoint | Method | Test Case | Request Body | Expected Response | Status | Notes |
|---------|----------|--------|-----------|--------------|-------------------|--------|-------|
| BE-001 | `/notes` | GET | Fetch all notes | None | `200 OK` with array of notes | ⬜ | |
| BE-002 | `/notes` | POST | Create new note | `{"title":"Test","content":"Content"}` | `201 Created` with note object | ⬜ | |
| BE-003 | `/notes/{id}` | GET | Get single note | None | `200 OK` with note object | ⬜ | |
| BE-004 | `/notes/{id}` | PUT | Update note content | `{"content":"Updated"}` | `200 OK` with updated note | ⬜ | |
| BE-005 | `/notes/{id}` | DELETE | Delete note | None | `204 No Content` | ⬜ | |
| BE-006 | `/notes/{id}/priority` | PATCH | Update priority | `{"isPinned":true}` | `200 OK` with updated note | ⬜ | |
| BE-007 | `/notes` | POST | Create without title | `{"content":"Only content"}` | `201 Created`, title extracted | ⬜ | |
| BE-008 | `/notes/{id}` | GET | Get non-existent note | None | `404 Not Found` | ⬜ | |
| BE-009 | `/notes/{id}` | PUT | Update deleted note | `{"content":"New"}` | Appropriate error or success | ⬜ | |

### API Testing Tools

**Using PowerShell:**
```powershell
# Get all notes
Invoke-RestMethod -Uri "http://localhost:8080/api/notes" -Method Get

# Create note
$body = @{
    title = "Test Note"
    content = "This is a test"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/notes" -Method Post -Body $body -ContentType "application/json"

# Update note (replace {id} with actual ID)
$updateBody = @{
    content = "Updated content"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/notes/{id}" -Method Put -Body $updateBody -ContentType "application/json"
```

**Using Postman:**
1. Import collection with base URL: `http://localhost:8080/api`
2. Create requests for each endpoint
3. Test with various payloads

---

### 11. Database Integration Testing

| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| BE-010 | Note persists in database | 1. Create note via API<br>2. Query database | Note exists in `note` table | ⬜ | |
| BE-011 | Transaction recorded | 1. Create note via API<br>2. Check `note_transaction` table | Transaction entry created | ⬜ | |
| BE-012 | Update creates transaction | 1. Update existing note<br>2. Check transactions | New transaction with UPDATE action | ⬜ | |
| BE-013 | Priority change transaction | 1. Change priority via API<br>2. Check transactions | Transaction with PRIORITY_CHANGE action | ⬜ | |
| BE-014 | Delete creates transaction | 1. Delete note via API<br>2. Check transactions | Transaction with DELETE action | ⬜ | |
| BE-015 | Note relationships | 1. Create note<br>2. Perform actions<br>3. Query with joins | All related transactions linked | ⬜ | |

**SQL Queries for Verification:**
```sql
-- View all notes
SELECT * FROM note;

-- View all transactions
SELECT * FROM note_transaction ORDER BY timestamp DESC;

-- View note with transactions
SELECT n.*, nt.action_type, nt.timestamp 
FROM note n 
LEFT JOIN note_transaction nt ON n.id = nt.note_id 
ORDER BY nt.timestamp DESC;

-- Count transactions per note
SELECT note_id, COUNT(*) as transaction_count 
FROM note_transaction 
GROUP BY note_id;
```

---

## Blockchain Integration Testing

### 12. Wallet Integration Testing

| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| BC-001 | Connect Nami wallet | 1. Click Connect Wallet<br>2. Select Nami<br>3. Approve | Wallet connects successfully | ⬜ | |
| BC-002 | Connect Eternl wallet | 1. Select Eternl from list | Wallet connects successfully | ⬜ | |
| BC-003 | Connect Flint wallet | 1. Select Flint from list | Wallet connects successfully | ⬜ | |
| BC-004 | Wallet not installed | 1. Try connecting non-installed wallet | Shows error: "Wallet not found" | ⬜ | |
| BC-005 | Network verification | 1. Connect wallet<br>2. Check network | Must be on Preprod/Testnet | ⬜ | |
| BC-006 | Switch network warning | 1. Switch wallet to Mainnet<br>2. Refresh app | Shows warning about network | ⬜ | |

---

### 13. Transaction Creation Testing

| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| BC-007 | Create note transaction | 1. Create new note<br>2. Save to blockchain<br>3. Approve in wallet | Transaction submitted successfully | ⬜ | |
| BC-008 | Transaction fee display | 1. Initiate blockchain save<br>2. Check wallet popup | Shows fee in ADA | ⬜ | |
| BC-009 | Transaction metadata | 1. Save note to blockchain<br>2. Check transaction on explorer<br>3. View metadata | Contains note data (title, content, action) | ⬜ | Use Cardanoscan Preprod |
| BC-010 | Update note transaction | 1. Edit existing note<br>2. Save to blockchain | New transaction created | ⬜ | |
| BC-011 | Priority change transaction | 1. Pin/unpin note<br>2. Save to blockchain | Transaction with priority metadata | ⬜ | |
| BC-012 | Transaction rejection | 1. Initiate save<br>2. Reject in wallet | Transaction cancelled, note still in local state | ⬜ | |
| BC-013 | Insufficient funds | 1. Use wallet with < 2 ADA<br>2. Try to save | Shows error about insufficient funds | ⬜ | |
| BC-014 | Transaction hash stored | 1. Save note to blockchain<br>2. Check backend database | `transactionHash` field populated | ⬜ | |

---

### 14. Blockchain Status Monitoring

| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| BC-015 | Pending status immediately | 1. Submit transaction<br>2. Check note status | Shows "PENDING" immediately | ⬜ | |
| BC-016 | Mempool monitoring | 1. Submit transaction<br>2. Check Cardanoscan mempool | Transaction appears in mempool | ⬜ | |
| BC-017 | Confirmation detection | 1. Wait for confirmation (2-5 min)<br>2. Check note status | Changes to "CONFIRMED" | ⬜ | |
| BC-018 | Multiple confirmations | 1. Wait 10+ minutes<br>2. Check block depth | Shows confirmation count | ⬜ | If implemented |
| BC-019 | Failed transaction handling | 1. Submit tx with insufficient fee<br>2. Wait for failure | Status shows error/failed | ⬜ | |
| BC-020 | Transaction history accuracy | 1. Create multiple notes<br>2. Check wallet transaction history | All transactions listed | ⬜ | |

---

### 15. Metadata Verification on Blockchain

| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| BC-021 | Verify CREATE metadata | 1. Create note on blockchain<br>2. Find tx on explorer<br>3. Check metadata | Contains: action, noteId, title, content | ⬜ | |
| BC-022 | Verify UPDATE metadata | 1. Update note on blockchain<br>2. Check tx metadata | Contains: action, noteId, contentBefore, contentAfter | ⬜ | |
| BC-023 | Verify PRIORITY metadata | 1. Change priority on blockchain<br>2. Check tx metadata | Contains: action, noteId, isPinned, priority | ⬜ | |
| BC-024 | Chunked metadata on chain | 1. Save large note (1000+ chars)<br>2. Find tx on explorer<br>3. Check metadata structure | Metadata shows chunks array with totalLength | ⬜ | |
| BC-025 | Metadata label verification | 1. Check any transaction<br>2. View metadata label | Uses label `674` (or custom label) | ⬜ | Check paymentService.js |
| BC-026 | Service address correct | 1. Submit transaction<br>2. Check recipient address | Matches VITE_SERVICE_ADDRESS | ⬜ | |

**How to Verify on Blockchain:**
1. Copy transaction hash from wallet or app
2. Visit [Cardanoscan Preprod](https://preprod.cardanoscan.io/)
3. Paste hash in search
4. Click on "Metadata" tab
5. Verify JSON structure matches expected format

---

### 16. Edge Cases & Error Handling

| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| BC-027 | Wallet disconnects mid-transaction | 1. Initiate save<br>2. Disconnect wallet<br>3. Try to confirm | Shows error, allows reconnect | ⬜ | |
| BC-028 | Network congestion | 1. Submit during high traffic<br>2. Monitor status | Transaction eventually confirms or shows delay warning | ⬜ | |
| BC-029 | Duplicate transaction prevention | 1. Click save multiple times rapidly | Only one transaction submitted | ⬜ | |
| BC-030 | Browser refresh during tx | 1. Submit transaction<br>2. Refresh browser immediately | Transaction continues, status updates on load | ⬜ | |
| BC-031 | Concurrent transactions | 1. Open app in 2 tabs<br>2. Submit tx in both | Both succeed or proper queue handling | ⬜ | |
| BC-032 | Very large note (5000 chars) | 1. Create 5000+ character note<br>2. Save to blockchain | Chunking works, transaction succeeds | ⬜ | |
| BC-033 | Special characters in metadata | 1. Create note with emojis, symbols<br>2. Save to blockchain | Characters preserved correctly | ⬜ | |
| BC-034 | Empty note blockchain save | 1. Try to save note with no content | Prevented or handled gracefully | ⬜ | |

---

## Test Cases & Results

### Test Execution Summary

| Category | Total Tests | Passed | Failed | Blocked | Not Run |
|----------|-------------|--------|--------|---------|---------|
| Frontend | 68 | 0 | 0 | 0 | 68 |
| Backend | 15 | 0 | 0 | 0 | 15 |
| Blockchain | 28 | 0 | 0 | 0 | 28 |
| **TOTAL** | **111** | **0** | **0** | **0** | **111** |

### Test Environment Details

```
Frontend:
- URL: http://localhost:5173
- Node Version: [Fill in]
- Browser: [Fill in]
- Wallet Extension: [Fill in]

Backend:
- URL: http://localhost:8080
- Java Version: [Fill in]
- Spring Boot Version: [Fill in]

Database:
- PostgreSQL Version: [Fill in]
- Host: localhost:5432
- Database: notes_db

Blockchain:
- Network: Cardano Preprod Testnet
- Wallet: [Fill in]
- Test Address: [Fill in]
- Starting Balance: [Fill in] ADA
```

---

## Bug Report Template

When you find a bug, document it using this template:

```markdown
### BUG-[NUMBER]: [Brief Description]

**Severity:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low
**Priority:** High / Medium / Low
**Status:** Open / In Progress / Resolved / Closed

**Test Case ID:** [e.g., FE-015]

**Environment:**
- Branch: refined
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- Browser: Chrome 120.0
- Wallet: Nami 3.5.0
- Date: YYYY-MM-DD

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Screenshots/Logs:**
[Attach screenshots or paste console logs]

**Additional Notes:**
[Any other relevant information]

**Assignee:** [Developer name]
```

### Example Bug Report:

```markdown
### BUG-001: Status pill not updating after confirmation

**Severity:** 🟡 Medium
**Priority:** Medium
**Status:** Open

**Test Case ID:** BC-017

**Environment:**
- Branch: refined
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- Browser: Chrome 120.0
- Wallet: Nami 3.5.0
- Date: 2025-12-10

**Steps to Reproduce:**
1. Create a new note
2. Save to blockchain
3. Wait 5 minutes for confirmation
4. Refresh page
5. Check note status pill

**Expected Result:**
Status pill changes from "PENDING" to "CONFIRMED" with green background

**Actual Result:**
Status pill remains "PENDING" with yellow background

**Screenshots/Logs:**
[Attach screenshot of note with PENDING status after 5+ minutes]

Console shows:
```
Status check failed: Transaction hash not found
```

**Additional Notes:**
Transaction was confirmed on Cardanoscan but frontend doesn't detect it

**Assignee:** [Frontend Developer]
```

---

## Testing Checklist

### Before Testing:
- [ ] Backend server running
- [ ] Frontend server running
- [ ] PostgreSQL database running and accessible
- [ ] Wallet extension installed
- [ ] Wallet switched to Preprod testnet
- [ ] Test ADA available (min 10 ADA)
- [ ] Browser DevTools open
- [ ] Network tab monitoring
- [ ] Console tab visible

### During Testing:
- [ ] Follow test cases in order
- [ ] Mark results in status column (✅ Pass / ❌ Fail / ⬜ Not Run)
- [ ] Document all bugs found
- [ ] Take screenshots of issues
- [ ] Copy error messages from console
- [ ] Note transaction hashes
- [ ] Record test data used

### After Testing:
- [ ] Update test summary table
- [ ] Create bug reports for all failures
- [ ] Share results with team
- [ ] Recommend priority fixes
- [ ] Suggest improvements
- [ ] Archive test evidence

---

## Additional Testing Tools

### Browser DevTools Monitoring:

**Console Tab:**
- Watch for errors (red)
- Note warnings (yellow)
- Look for blockchain transaction logs
- Monitor API calls

**Network Tab:**
- Filter: XHR to see API calls
- Check status codes (200, 201, 404, 500)
- Inspect request/response payloads
- Monitor transaction submissions

**Application Tab:**
- Check localStorage for cached transactions
- Verify session data
- Inspect IndexedDB if used

### Blockchain Explorers:

**Preprod Testnet:**
- [Cardanoscan Preprod](https://preprod.cardanoscan.io/)
- [Cexplorer Preprod](https://preprod.cexplorer.io/)

**How to Use:**
1. Copy transaction hash from wallet
2. Search on explorer
3. Verify:
   - Transaction status
   - Metadata content
   - Fees paid
   - Block height
   - Confirmations

---

## Performance Testing

| Test ID | Metric | Test Case | Target | Actual | Status |
|---------|--------|-----------|--------|--------|--------|
| PERF-001 | Page load time | Initial app load | < 2 seconds | | ⬜ |
| PERF-002 | API response time | GET /notes | < 500ms | | ⬜ |
| PERF-003 | Transaction submission | Save to blockchain | < 10 seconds | | ⬜ |
| PERF-004 | Search responsiveness | Filter 100 notes | < 100ms | | ⬜ |
| PERF-005 | Editor typing lag | Type in large note | No lag | | ⬜ |

---

## Security Testing

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| SEC-001 | SQL injection test | Try SQL in search box | No database error | ⬜ |
| SEC-002 | XSS test | Create note with `<script>` | Script doesn't execute | ⬜ |
| SEC-003 | CORS validation | Call API from different origin | Blocked or allowed properly | ⬜ |
| SEC-004 | Wallet signature validation | Submit transaction without wallet | Rejected | ⬜ |
| SEC-005 | Private key exposure | Check console/network | No keys visible | ⬜ |

---

## Regression Testing Checklist

Run these tests after any code changes:

**Critical Path:**
- [ ] Connect wallet
- [ ] Create note
- [ ] Edit note
- [ ] Save to blockchain
- [ ] Verify status changes
- [ ] View transaction history
- [ ] Disconnect wallet

**Smoke Test (5 minutes):**
- [ ] App loads without errors
- [ ] Can create note
- [ ] Can edit note
- [ ] Wallet connects
- [ ] API calls work

---

## Test Data Management

### Sample Test Data:

**Short Note:**
```
Title: Test Note
Content: This is a test note for QA.
```

**Medium Note:**
```
Title: Meeting Notes - December 10
Content: [250 characters of Lorem ipsum...]
```

**Large Note:**
```
Title: Project Documentation
Content: [1500 characters including special chars, emojis, line breaks]
```

**Edge Cases:**
- Empty note
- Note with only spaces
- Note with special characters: `!@#$%^&*(){}[]|<>?`
- Note with emojis: 🎉🚀💻📝✅❌
- Note with URLs: https://example.com
- Note with code blocks: ```code```

---

## Reporting Results

### Daily Test Summary Template:

```markdown
# QA Test Summary - [Date]

**Tester:** [Your Name]
**Branch:** refined
**Duration:** [X hours]

## Tests Executed:
- Frontend: X/68 tests run
- Backend: X/15 tests run
- Blockchain: X/28 tests run

## Results:
- ✅ Passed: X
- ❌ Failed: X
- ⚠️ Blocked: X

## Bugs Found:
1. BUG-XXX: [Brief description] - [Severity]
2. BUG-XXX: [Brief description] - [Severity]

## Blockers:
- [List any issues preventing testing]

## Notes:
- [Any observations or recommendations]

## Next Steps:
- [What needs to be tested next]
```

---

## Contact & Support

- **Project Repository:** https://github.com/flyingfinnn/Team_Masikip
- **Branch for Testing:** refined
- **Report Issues:** [GitHub Issues or team communication channel]

---

**END OF QA TESTING GUIDE**

*Last Updated: December 10, 2025*  
*Version: 1.0*  
*Prepared by: QA Team - Team Masikip*
