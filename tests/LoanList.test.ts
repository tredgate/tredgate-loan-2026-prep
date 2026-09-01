import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoanList from '../src/components/LoanList.vue'
import type { LoanApplication } from '../src/types/loan'

/** Baseline pending loan used across multiple tests. */
const pendingLoan: LoanApplication = {
  id: 'loan-1',
  applicantName: 'Alice',
  amount: 10000,
  termMonths: 12,
  interestRate: 0.1,
  status: 'pending',
  createdAt: '2024-06-15T00:00:00.000Z'
}

/** Approved variant — identical to `pendingLoan` except for id and status. */
const approvedLoan: LoanApplication = {
  ...pendingLoan,
  id: 'loan-2',
  applicantName: 'Bob',
  status: 'approved'
}

/** Rejected variant — identical to `pendingLoan` except for id and status. */
const rejectedLoan: LoanApplication = {
  ...pendingLoan,
  id: 'loan-3',
  applicantName: 'Carol',
  status: 'rejected'
}

describe('LoanList', () => {
  /**
   * When the `loans` prop is an empty array, the component must display the
   * empty-state message and must not render a table.
   */
  it('shows empty state when no loans provided', () => {
    const wrapper = mount(LoanList, { props: { loans: [] } })
    expect(wrapper.text()).toContain('No loan applications yet')
    expect(wrapper.find('table').exists()).toBe(false)
  })

  /**
   * When at least one loan is provided the component must render a `<table>`
   * and must not show the empty-state fallback.
   */
  it('renders a table when loans are provided', () => {
    const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.find('.empty-state').exists()).toBe(false)
  })

  /**
   * The applicant name and formatted amount must be visible in the table row
   * so reviewers can identify each application at a glance.
   */
  it('displays applicant name and amount', () => {
    const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('10,000')
  })

  /**
   * A pending loan must have exactly three action buttons: approve (✓),
   * reject (✗), and auto-decide (⚡).
   */
  it('shows approve, reject, and auto-decide buttons for pending loans', () => {
    const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
    const buttons = wrapper.findAll('.action-btn')
    expect(buttons).toHaveLength(3)
  })

  /**
   * Once a loan is approved it can no longer be actioned, so no action
   * buttons should appear and the placeholder dash must be shown instead.
   */
  it('hides action buttons for approved loans', () => {
    const wrapper = mount(LoanList, { props: { loans: [approvedLoan] } })
    expect(wrapper.findAll('.action-btn')).toHaveLength(0)
    expect(wrapper.find('.no-actions').exists()).toBe(true)
  })

  /**
   * Once a loan is rejected it can no longer be actioned, so no action
   * buttons should appear in its row.
   */
  it('hides action buttons for rejected loans', () => {
    const wrapper = mount(LoanList, { props: { loans: [rejectedLoan] } })
    expect(wrapper.findAll('.action-btn')).toHaveLength(0)
  })

  /**
   * Clicking the approve button (`.action-btn.success`) must emit the
   * `approve` event carrying the loan's ID as the payload.
   */
  it('emits approve event when approve button clicked', async () => {
    const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
    await wrapper.find('.action-btn.success').trigger('click')
    expect(wrapper.emitted('approve')).toBeTruthy()
    expect(wrapper.emitted('approve')?.[0]).toEqual(['loan-1'])
  })

  /**
   * Clicking the reject button (`.action-btn.danger`) must emit the
   * `reject` event carrying the loan's ID as the payload.
   */
  it('emits reject event when reject button clicked', async () => {
    const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
    await wrapper.find('.action-btn.danger').trigger('click')
    expect(wrapper.emitted('reject')).toBeTruthy()
    expect(wrapper.emitted('reject')?.[0]).toEqual(['loan-1'])
  })

  /**
   * Clicking the auto-decide button (`.action-btn.secondary`) must emit the
   * `autoDecide` event carrying the loan's ID as the payload.
   */
  it('emits autoDecide event when auto-decide button clicked', async () => {
    const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
    await wrapper.find('.action-btn.secondary').trigger('click')
    expect(wrapper.emitted('autoDecide')).toBeTruthy()
    expect(wrapper.emitted('autoDecide')?.[0]).toEqual(['loan-1'])
  })

  /**
   * Each status must render a badge with the corresponding CSS class
   * (`status-pending`, `status-approved`, `status-rejected`) so users can
   * distinguish statuses at a glance via colour coding.
   */
  it('shows status badge with correct class', () => {
    const wrapper = mount(LoanList, { props: { loans: [pendingLoan, approvedLoan, rejectedLoan] } })
    expect(wrapper.find('.status-pending').exists()).toBe(true)
    expect(wrapper.find('.status-approved').exists()).toBe(true)
    expect(wrapper.find('.status-rejected').exists()).toBe(true)
  })

  /**
   * The Monthly Payment column must show a value derived from the loan data.
   * For $10,000 at 10% over 12 months the result is approximately $916.67.
   */
  it('displays monthly payment column', () => {
    // For $10000, 10% rate, 12 months: total = 11000, monthly = 916.67
    const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
    expect(wrapper.text()).toContain('916')
  })

  /**
   * When multiple loans are provided, each one must produce its own `<tr>` so
   * every application is listed separately.
   */
  it('renders multiple loans', () => {
    const loans = [pendingLoan, approvedLoan, rejectedLoan]
    const wrapper = mount(LoanList, { props: { loans } })
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(3)
  })

  describe('formatCurrency', () => {
    /**
     * Loan amounts must be formatted as USD currency with two decimal places
     * (e.g. `$10,000.00`) so figures are immediately readable.
     */
    it('formats amount as USD currency in the table', () => {
      const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
      expect(wrapper.text()).toContain('$10,000.00')
    })
  })

  describe('formatPercent', () => {
    /**
     * Interest rates stored as decimals (e.g. `0.1`) must be displayed as
     * human-readable percentages (e.g. `10.0%`).
     */
    it('displays interest rate as percentage', () => {
      const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
      expect(wrapper.text()).toContain('10.0%')
    })
  })

  describe('formatDate', () => {
    /**
     * ISO timestamps must be formatted as a readable date string that includes
     * the abbreviated month name and four-digit year (e.g. `Jun 15, 2024`).
     */
    it('formats created date in readable format', () => {
      const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
      // 2024-06-15 should show "Jun 15, 2024" or similar
      expect(wrapper.text()).toMatch(/Jun[\s\S]*2024/)
    })
  })
})

