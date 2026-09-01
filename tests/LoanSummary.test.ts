import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoanSummary from '../src/components/LoanSummary.vue'
import type { LoanApplication } from '../src/types/loan'

/**
 * Helper that creates an array of `LoanApplication` objects from partial
 * overrides, filling in sensible defaults for every other field.
 *
 * @param overrides - Partial loan objects; each entry becomes one loan.
 * @returns Array of fully-populated `LoanApplication` objects.
 */
function makeLoans(overrides: Partial<LoanApplication>[] = []): LoanApplication[] {
  return overrides.map((o, i) => ({
    id: `${i}`,
    applicantName: 'Test User',
    amount: 10000,
    termMonths: 12,
    interestRate: 0.05,
    status: 'pending',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...o
  }))
}

describe('LoanSummary', () => {
  /**
   * When no loans are provided every counter must display `0` and the total
   * approved amount must be `$0` — the component must never show undefined or
   * blank values.
   */
  it('shows zeros when no loans', () => {
    const wrapper = mount(LoanSummary, { props: { loans: [] } })
    const values = wrapper.findAll('.stat-value').map(v => v.text())
    expect(values[0]).toBe('0')   // total
    expect(values[1]).toBe('0')   // pending
    expect(values[2]).toBe('0')   // approved
    expect(values[3]).toBe('0')   // rejected
    expect(values[4]).toBe('$0')  // total approved amount
  })

  /**
   * Given a mixed set of loans the summary must show the correct count for
   * each status bucket and the correct total approved amount.
   * Example: 1 pending, 2 approved ($5k + $3k = $8k), 1 rejected.
   */
  it('counts loans by status', () => {
    const loans = makeLoans([
      { status: 'pending' },
      { status: 'approved', amount: 5000 },
      { status: 'approved', amount: 3000 },
      { status: 'rejected' }
    ])
    const wrapper = mount(LoanSummary, { props: { loans } })
    const values = wrapper.findAll('.stat-value').map(v => v.text())
    expect(values[0]).toBe('4')       // total
    expect(values[1]).toBe('1')       // pending
    expect(values[2]).toBe('2')       // approved
    expect(values[3]).toBe('1')       // rejected
    expect(values[4]).toContain('8,000') // total approved = 8000
  })

  /**
   * The total approved amount must be the sum of `amount` across all approved
   * loans only. Here two approved loans add up to $100,000.
   */
  it('calculates total approved amount correctly', () => {
    const loans = makeLoans([
      { status: 'approved', amount: 25000 },
      { status: 'approved', amount: 75000 },
      { status: 'pending', amount: 50000 }
    ])
    const wrapper = mount(LoanSummary, { props: { loans } })
    const amountValue = wrapper.findAll('.stat-value')[4].text()
    expect(amountValue).toContain('100,000')
  })

  /**
   * Pending and rejected loan amounts must be excluded from the total.
   * Even a large rejected amount ($99,999) must not appear in the approved total.
   */
  it('only includes approved amounts in total', () => {
    const loans = makeLoans([
      { status: 'rejected', amount: 99999 },
      { status: 'pending', amount: 99999 },
      { status: 'approved', amount: 10000 }
    ])
    const wrapper = mount(LoanSummary, { props: { loans } })
    const amountValue = wrapper.findAll('.stat-value')[4].text()
    expect(amountValue).toContain('10,000')
    expect(amountValue).not.toContain('99,999')
  })

  /**
   * The component must always render exactly five stat cards regardless of
   * the loan data: Total, Pending, Approved, Rejected, and Total Approved.
   */
  it('renders five stat cards', () => {
    const wrapper = mount(LoanSummary, { props: { loans: [] } })
    expect(wrapper.findAll('.stat-card')).toHaveLength(5)
  })
})

