import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoanSummary from '../src/components/LoanSummary.vue'
import type { LoanApplication } from '../src/types/loan'

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
  it('shows zeros when no loans', () => {
    const wrapper = mount(LoanSummary, { props: { loans: [] } })
    const values = wrapper.findAll('.stat-value').map(v => v.text())
    expect(values[0]).toBe('0')   // total
    expect(values[1]).toBe('0')   // pending
    expect(values[2]).toBe('0')   // approved
    expect(values[3]).toBe('0')   // rejected
    expect(values[4]).toBe('$0')  // total approved amount
  })

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

  it('renders five stat cards', () => {
    const wrapper = mount(LoanSummary, { props: { loans: [] } })
    expect(wrapper.findAll('.stat-card')).toHaveLength(5)
  })
})
