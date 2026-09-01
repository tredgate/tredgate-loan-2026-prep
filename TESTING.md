# Testing Guide

Tredgate Loan uses **Vitest** for unit testing with **@vue/test-utils** for Vue component testing.

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests and generate an HTML report
npm run test:report
```

## HTML Report

After running `npm run test:report`, open the report at:

```
test-report/index.html
```

Or preview it with:

```bash
npx vite preview --outDir test-report
```

## Test Structure

```
tests/
├── loanService.test.ts   # Unit tests for all service functions
├── LoanForm.test.ts      # Component tests for the loan submission form
├── LoanList.test.ts      # Component tests for the loan table/list
└── LoanSummary.test.ts   # Component tests for the statistics summary
```

## Coverage Summary

| File | What is tested |
|------|----------------|
| `loanService.ts` | `getLoans`, `saveLoans`, `createLoanApplication` (validation & happy path), `updateLoanStatus`, `calculateMonthlyPayment`, `autoDecideLoan` |
| `LoanForm.vue` | Field rendering, validation errors, successful submission, form reset, service error propagation |
| `LoanList.vue` | Empty state, table rows, status badges, action buttons per status, emitted events, currency/percent/date formatting |
| `LoanSummary.vue` | Stat card counts (total, pending, approved, rejected), total approved amount, reactivity on prop changes |

## Mocking

- **`localStorage`** is mocked in `loanService.test.ts` using a simple in-memory store so tests stay isolated and fast.
- **`loanService`** is mocked in `LoanForm.test.ts` using `vi.mock` so component tests do not depend on localStorage.
- **`calculateMonthlyPayment`** is mocked in `LoanList.test.ts` with a local implementation that mirrors the real formula.

## CI

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every pull request and push to `main`:

1. Lint → test (with HTML report) → build.
2. The `test-report/` folder is uploaded as an artifact named **test-report** (retained for 30 days).
3. A Markdown summary with pass/fail counts is written to the workflow run summary page.
