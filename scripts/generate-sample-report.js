#!/usr/bin/env node
/* eslint-env node */
/**
 * generate-sample-report.js
 *
 * Generates a self-contained sample HTML test report in the `reports/`
 * folder without running the real test suite.  The report mirrors the
 * structure produced by `npm run test:report` so you can preview what
 * the CI artifact looks like before pushing a branch.
 *
 * Usage:
 *   node scripts/generate-sample-report.js
 *
 * Output:
 *   reports/sample-report.html
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const reportsDir = join(__dirname, '..', 'reports')
const outputFile = join(reportsDir, 'sample-report.html')

// ---------------------------------------------------------------------------
// Sample test data that mirrors the real test suite
// ---------------------------------------------------------------------------

/** @typedef {{ name: string, duration: number, status: 'passed' | 'failed' }} TestCase */

/**
 * @typedef {{ suiteName: string, file: string, tests: TestCase[] }} TestSuite
 */

/** @type {TestSuite[]} */
const suites = [
  {
    suiteName: 'loanService › getLoans',
    file: 'tests/loanService.test.ts',
    tests: [
      { name: 'returns empty array when nothing is stored', duration: 4, status: 'passed' },
      { name: 'returns stored loans', duration: 1, status: 'passed' }
    ]
  },
  {
    suiteName: 'loanService › saveLoans',
    file: 'tests/loanService.test.ts',
    tests: [
      { name: 'saves loans to localStorage', duration: 2, status: 'passed' }
    ]
  },
  {
    suiteName: 'loanService › createLoanApplication',
    file: 'tests/loanService.test.ts',
    tests: [
      { name: 'creates a new loan with pending status', duration: 2, status: 'passed' },
      { name: 'throws error for empty applicant name', duration: 2, status: 'passed' },
      { name: 'throws error for amount <= 0', duration: 1, status: 'passed' },
      { name: 'throws error for termMonths <= 0', duration: 1, status: 'passed' },
      { name: 'throws error for negative interest rate', duration: 1, status: 'passed' }
    ]
  },
  {
    suiteName: 'loanService › updateLoanStatus',
    file: 'tests/loanService.test.ts',
    tests: [
      { name: 'updates loan status', duration: 1, status: 'passed' },
      { name: 'throws error for non-existent loan', duration: 1, status: 'passed' }
    ]
  },
  {
    suiteName: 'loanService › calculateMonthlyPayment',
    file: 'tests/loanService.test.ts',
    tests: [
      { name: 'calculates monthly payment correctly for basic case', duration: 1, status: 'passed' },
      { name: 'calculates monthly payment for 0% interest', duration: 1, status: 'passed' },
      { name: 'calculates monthly payment for large loan', duration: 1, status: 'passed' }
    ]
  },
  {
    suiteName: 'loanService › autoDecideLoan',
    file: 'tests/loanService.test.ts',
    tests: [
      { name: 'approves loan when amount <= 100000 and termMonths <= 60', duration: 1, status: 'passed' },
      { name: 'approves small, short-term loan', duration: 1, status: 'passed' },
      { name: 'rejects loan when amount > 100000', duration: 3, status: 'passed' },
      { name: 'rejects loan when termMonths > 60', duration: 1, status: 'passed' },
      { name: 'rejects loan when both amount and termMonths exceed limits', duration: 1, status: 'passed' },
      { name: 'throws error for non-existent loan', duration: 1, status: 'passed' }
    ]
  },
  {
    suiteName: 'LoanForm',
    file: 'tests/LoanForm.test.ts',
    tests: [
      { name: 'renders all form fields', duration: 31, status: 'passed' },
      { name: 'shows error when applicant name is empty', duration: 10, status: 'passed' },
      { name: 'shows error when amount is missing', duration: 7, status: 'passed' },
      { name: 'shows error when termMonths is missing', duration: 6, status: 'passed' },
      { name: 'shows error when interest rate is missing', duration: 7, status: 'passed' },
      { name: 'calls createLoanApplication with correct data on valid submit', duration: 7, status: 'passed' },
      { name: 'emits created event after successful submission', duration: 10, status: 'passed' },
      { name: 'resets form fields after successful submission', duration: 5, status: 'passed' },
      { name: 'shows error message when createLoanApplication throws', duration: 7, status: 'passed' },
      { name: 'does not show error message initially', duration: 3, status: 'passed' }
    ]
  },
  {
    suiteName: 'LoanList',
    file: 'tests/LoanList.test.ts',
    tests: [
      { name: 'shows empty state when no loans provided', duration: 31, status: 'passed' },
      { name: 'renders a table when loans are provided', duration: 744, status: 'passed' },
      { name: 'displays applicant name and amount', duration: 5, status: 'passed' },
      { name: 'shows approve, reject, and auto-decide buttons for pending loans', duration: 11, status: 'passed' },
      { name: 'hides action buttons for approved loans', duration: 5, status: 'passed' },
      { name: 'hides action buttons for rejected loans', duration: 4, status: 'passed' },
      { name: 'emits approve event when approve button clicked', duration: 7, status: 'passed' },
      { name: 'emits reject event when reject button clicked', duration: 4, status: 'passed' },
      { name: 'emits autoDecide event when auto-decide button clicked', duration: 4, status: 'passed' },
      { name: 'shows status badge with correct class', duration: 6, status: 'passed' },
      { name: 'displays monthly payment column', duration: 3, status: 'passed' },
      { name: 'renders multiple loans', duration: 4, status: 'passed' },
      { name: 'formatCurrency › formats amount as USD currency in the table', duration: 2, status: 'passed' },
      { name: 'formatPercent › displays interest rate as percentage', duration: 2, status: 'passed' },
      { name: 'formatDate › formats created date in readable format', duration: 3, status: 'passed' }
    ]
  },
  {
    suiteName: 'LoanSummary',
    file: 'tests/LoanSummary.test.ts',
    tests: [
      { name: 'shows zeros when no loans', duration: 74, status: 'passed' },
      { name: 'counts loans by status', duration: 4, status: 'passed' },
      { name: 'calculates total approved amount correctly', duration: 2, status: 'passed' },
      { name: 'only includes approved amounts in total', duration: 3, status: 'passed' },
      { name: 'renders five stat cards', duration: 4, status: 'passed' }
    ]
  }
]

// ---------------------------------------------------------------------------
// Aggregate counts
// ---------------------------------------------------------------------------

const allTests = suites.flatMap(s => s.tests)
const totalCount = allTests.length
const passedCount = allTests.filter(t => t.status === 'passed').length
const failedCount = allTests.filter(t => t.status === 'failed').length
const totalDuration = allTests.reduce((sum, t) => sum + t.duration, 0)
const generatedAt = new Date().toLocaleString()

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

/**
 * Renders a single test row.
 * @param {TestCase} test
 * @returns {string}
 */
function renderTestRow(test) {
  const icon = test.status === 'passed' ? '✓' : '✗'
  const cls = test.status === 'passed' ? 'passed' : 'failed'
  return `
    <tr class="test-row ${cls}">
      <td class="icon">${icon}</td>
      <td class="test-name">${escapeHtml(test.name)}</td>
      <td class="duration">${test.duration} ms</td>
    </tr>`
}

/**
 * Renders a suite block containing its test rows.
 * @param {TestSuite} suite
 * @returns {string}
 */
function renderSuite(suite) {
  const passedInSuite = suite.tests.filter(t => t.status === 'passed').length
  const failedInSuite = suite.tests.filter(t => t.status === 'failed').length
  const suiteClass = failedInSuite > 0 ? 'suite-failed' : 'suite-passed'

  return `
  <div class="suite ${suiteClass}">
    <div class="suite-header">
      <span class="suite-name">${escapeHtml(suite.suiteName)}</span>
      <span class="suite-file">${escapeHtml(suite.file)}</span>
      <span class="suite-counts">
        <span class="badge passed">${passedInSuite} passed</span>
        ${failedInSuite > 0 ? `<span class="badge failed">${failedInSuite} failed</span>` : ''}
      </span>
    </div>
    <table class="tests-table">
      <tbody>
        ${suite.tests.map(renderTestRow).join('')}
      </tbody>
    </table>
  </div>`
}

/**
 * Minimal HTML entity escaper to prevent XSS in test names.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ---------------------------------------------------------------------------
// Assemble the full HTML document
// ---------------------------------------------------------------------------

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tredgate Loan — Sample Test Report</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #f0f2f5;
      color: #1a1a2e;
      padding: 2rem;
    }

    header {
      background: #1a1a2e;
      color: #fff;
      padding: 1.5rem 2rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    header h1 { font-size: 1.4rem; font-weight: 700; }
    header .meta { font-size: 0.85rem; opacity: 0.7; }

    .summary {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }

    .stat {
      background: #fff;
      border-radius: 8px;
      padding: 1rem 1.5rem;
      text-align: center;
      flex: 1;
      min-width: 120px;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
    }

    .stat .value { font-size: 2rem; font-weight: 700; }
    .stat .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: .05em; color: #666; margin-top: .25rem; }
    .stat.passed .value { color: #155724; }
    .stat.failed .value { color: #721c24; }
    .stat.total .value  { color: #004085; }
    .stat.duration .value { font-size: 1.4rem; color: #856404; }

    .suite {
      background: #fff;
      border-radius: 8px;
      margin-bottom: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
      overflow: hidden;
    }

    .suite-header {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: .75rem 1rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      flex-wrap: wrap;
    }

    .suite-passed .suite-header { border-left: 4px solid #28a745; }
    .suite-failed .suite-header { border-left: 4px solid #dc3545; }

    .suite-name { font-weight: 600; font-size: .95rem; }
    .suite-file { font-size: .8rem; color: #888; font-family: monospace; }
    .suite-counts { margin-left: auto; display: flex; gap: .4rem; }

    .badge {
      display: inline-block;
      padding: .2rem .6rem;
      border-radius: 99px;
      font-size: .75rem;
      font-weight: 600;
    }
    .badge.passed { background: #d4edda; color: #155724; }
    .badge.failed { background: #f8d7da; color: #721c24; }

    .tests-table { width: 100%; border-collapse: collapse; }

    .test-row td { padding: .45rem 1rem; font-size: .875rem; border-bottom: 1px solid #f0f2f5; }
    .test-row:last-child td { border-bottom: none; }
    .test-row.passed .icon { color: #28a745; font-weight: 700; }
    .test-row.failed .icon { color: #dc3545; font-weight: 700; }
    .test-row .duration { text-align: right; color: #888; white-space: nowrap; }

    footer { margin-top: 2rem; text-align: center; font-size: .8rem; color: #888; }

    .sample-banner {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 6px;
      padding: .75rem 1rem;
      margin-bottom: 1.5rem;
      font-size: .875rem;
      color: #856404;
    }
  </style>
</head>
<body>

<header>
  <div>
    <h1>🏦 Tredgate Loan — Test Report</h1>
    <div class="meta">Generated ${generatedAt}</div>
  </div>
  <div class="meta">Vitest v4 · jsdom environment</div>
</header>

<div class="sample-banner">
  ⚠️ <strong>Sample report</strong> — this file was generated by
  <code>node scripts/generate-sample-report.js</code> and contains representative
  data only. Run <code>npm run test:report</code> for a live report.
</div>

<div class="summary">
  <div class="stat total">
    <div class="value">${totalCount}</div>
    <div class="label">Total Tests</div>
  </div>
  <div class="stat passed">
    <div class="value">${passedCount}</div>
    <div class="label">Passed</div>
  </div>
  <div class="stat failed">
    <div class="value">${failedCount}</div>
    <div class="label">Failed</div>
  </div>
  <div class="stat duration">
    <div class="value">${totalDuration} ms</div>
    <div class="label">Duration</div>
  </div>
</div>

${suites.map(renderSuite).join('\n')}

<footer>
  Tredgate Loan · Vitest Unit Tests ·
  <a href="https://vitest.dev" target="_blank" rel="noopener">vitest.dev</a>
</footer>

</body>
</html>
`

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

mkdirSync(reportsDir, { recursive: true })
writeFileSync(outputFile, html, 'utf-8')

console.log(`✅  Sample report written to: reports/sample-report.html`)
console.log(`   Open it in your browser or run: npx serve reports`)
