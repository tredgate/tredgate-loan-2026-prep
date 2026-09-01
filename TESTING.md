# Testing Guide

## Overview

This project uses [Vitest](https://vitest.dev/) for unit testing, with [jsdom](https://github.com/jsdom/jsdom) as the browser environment and [@vue/test-utils](https://test-utils.vuejs.org/) for Vue component testing.

---

## Running Tests

| Command | Description |
|---|---|
| `npm run test` | Run all tests once |
| `npm run test:report` | Run all tests with coverage and HTML report |
| `npm run test:watch` | Watch mode (re-runs on file changes) |

---

## Test Coverage

Tests are located in the `tests/` directory and cover every file in `src/`:

### `loanService.test.ts` — Business logic

| Function | What is tested |
|---|---|
| `getLoans` | Returns empty array when nothing is stored; parses stored JSON correctly |
| `saveLoans` | Serialises and persists loans to localStorage |
| `createLoanApplication` | Creates loan with `pending` status; validates name, amount, term, and interest rate |
| `updateLoanStatus` | Updates status by ID; throws when ID not found |
| `calculateMonthlyPayment` | Correct result for standard, zero-interest, and large loans |
| `autoDecideLoan` | Approves eligible loans; rejects loans exceeding amount or term limits; throws when not found |

### `LoanForm.test.ts` — Form component

| Scenario | What is tested |
|---|---|
| Rendering | All input fields and submit button are present |
| Validation | Error messages for missing name, amount, term, and interest rate |
| Submission | Calls `createLoanApplication` with correct arguments |
| Success | Emits `created` event and resets the form |
| Service error | Displays the error message returned by the service |

### `LoanList.test.ts` — List component

| Scenario | What is tested |
|---|---|
| Empty state | Shows fallback message when no loans |
| Table rendering | Renders table and all rows |
| Display | Shows applicant name, formatted amount, interest rate, monthly payment, and date |
| Actions | Approve / Reject / Auto-decide buttons shown only for `pending` loans |
| Events | `approve`, `reject`, and `autoDecide` events emitted with correct loan ID |
| Status badges | Correct CSS class per status |

### `LoanSummary.test.ts` — Summary component

| Scenario | What is tested |
|---|---|
| Empty | All counters are zero |
| Counting | Correct totals per status |
| Amount | Total approved amount sums only approved loans |
| Layout | Five stat cards rendered |

---

## HTML Report

After running `npm run test:report`, an HTML report is generated in `test-report/`:

```
test-report/
  index.html       ← interactive Vitest UI report
  coverage/        ← code coverage report
    index.html
```

To view the report locally:

```sh
npx vite preview --outDir test-report
```

---

## Mocking

- **localStorage** is mocked via `Object.defineProperty` in `loanService.test.ts` to isolate storage calls.
- **`loanService`** module is fully mocked in `LoanForm.test.ts` using `vi.mock()` so form tests do not depend on localStorage.

---

## GitHub Actions

Tests run automatically on every pull request and push to `main`.  
The workflow (`.github/workflows/ci.yml`) will:

1. Install dependencies
2. Run the linter
3. Run tests and generate the HTML report + coverage
4. Upload the `test-report/` folder as a workflow artifact (retained for 30 days)
5. Write a test result summary to the workflow run overview

To download the HTML report, open the workflow run on GitHub, scroll to **Artifacts**, and download `test-report`.
