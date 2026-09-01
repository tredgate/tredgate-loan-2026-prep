import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LoanList from '../src/components/LoanList.vue'
import type { LoanApplication } from '../src/types/loan'

vi.mock('../src/services/loanService', () => ({
  calculateMonthlyPayment: vi.fn((loan: LoanApplication) => {
    return (loan.amount * (1 + loan.interestRate)) / loan.termMonths
  })
}))

const sampleLoans: LoanApplication[] = [
  {
    id: '1',
    applicantName: 'Alice Smith',
    amount: 50000,
    termMonths: 24,
    interestRate: 0.08,
    status: 'pending',
    createdAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: '2',
    applicantName: 'Bob Jones',
    amount: 20000,
    termMonths: 12,
    interestRate: 0.05,
    status: 'approved',
    createdAt: '2024-02-01T00:00:00.000Z'
  },
  {
    id: '3',
    applicantName: 'Carol White',
    amount: 75000,
    termMonths: 60,
    interestRate: 0.1,
    status: 'rejected',
    createdAt: '2024-03-10T00:00:00.000Z'
  }
]

describe('LoanList', () => {
  it('shows empty state when no loans', () => {
    const wrapper = mount(LoanList, { props: { loans: [] } })
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('renders table when loans are provided', () => {
    const wrapper = mount(LoanList, { props: { loans: sampleLoans } })
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.find('.empty-state').exists()).toBe(false)
  })

  it('renders one row per loan', () => {
    const wrapper = mount(LoanList, { props: { loans: sampleLoans } })
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(3)
  })

  it('displays applicant names correctly', () => {
    const wrapper = mount(LoanList, { props: { loans: sampleLoans } })
    const text = wrapper.text()
    expect(text).toContain('Alice Smith')
    expect(text).toContain('Bob Jones')
    expect(text).toContain('Carol White')
  })

  it('shows status badge for each loan', () => {
    const wrapper = mount(LoanList, { props: { loans: sampleLoans } })
    const badges = wrapper.findAll('.status-badge')
    expect(badges).toHaveLength(3)
    expect(badges[0]?.text()).toBe('pending')
    expect(badges[1]?.text()).toBe('approved')
    expect(badges[2]?.text()).toBe('rejected')
  })

  it('applies correct CSS class for status badges', () => {
    const wrapper = mount(LoanList, { props: { loans: sampleLoans } })
    const badges = wrapper.findAll('.status-badge')
    expect(badges[0]?.classes()).toContain('status-pending')
    expect(badges[1]?.classes()).toContain('status-approved')
    expect(badges[2]?.classes()).toContain('status-rejected')
  })

  it('shows action buttons only for pending loans', () => {
    const wrapper = mount(LoanList, { props: { loans: sampleLoans } })
    const rows = wrapper.findAll('tbody tr')

    // pending loan has 3 action buttons
    expect(rows[0]?.findAll('.action-btn')).toHaveLength(3)
    // approved loan has no action buttons
    expect(rows[1]?.findAll('.action-btn')).toHaveLength(0)
    // rejected loan has no action buttons
    expect(rows[2]?.findAll('.action-btn')).toHaveLength(0)
  })

  it('shows no-actions placeholder for non-pending loans', () => {
    const wrapper = mount(LoanList, { props: { loans: sampleLoans } })
    const rows = wrapper.findAll('tbody tr')
    expect(rows[1]?.find('.no-actions').exists()).toBe(true)
    expect(rows[2]?.find('.no-actions').exists()).toBe(true)
  })

  it('emits approve event when approve button is clicked', async () => {
    const wrapper = mount(LoanList, { props: { loans: sampleLoans } })
    const approveBtn = wrapper.findAll('.action-btn.success')[0]
    await approveBtn?.trigger('click')
    expect(wrapper.emitted('approve')).toBeTruthy()
    expect(wrapper.emitted('approve')?.[0]).toEqual(['1'])
  })

  it('emits reject event when reject button is clicked', async () => {
    const wrapper = mount(LoanList, { props: { loans: sampleLoans } })
    const rejectBtn = wrapper.findAll('.action-btn.danger')[0]
    await rejectBtn?.trigger('click')
    expect(wrapper.emitted('reject')).toBeTruthy()
    expect(wrapper.emitted('reject')?.[0]).toEqual(['1'])
  })

  it('emits autoDecide event when auto-decide button is clicked', async () => {
    const wrapper = mount(LoanList, { props: { loans: sampleLoans } })
    const autoBtn = wrapper.findAll('.action-btn.secondary')[0]
    await autoBtn?.trigger('click')
    expect(wrapper.emitted('autoDecide')).toBeTruthy()
    expect(wrapper.emitted('autoDecide')?.[0]).toEqual(['1'])
  })

  it('formats currency values in the table', () => {
    const wrapper = mount(LoanList, { props: { loans: [sampleLoans[0]!] } })
    expect(wrapper.text()).toContain('$50,000.00')
  })

  it('displays term in months', () => {
    const wrapper = mount(LoanList, { props: { loans: [sampleLoans[0]!] } })
    expect(wrapper.text()).toContain('24 mo')
  })

  it('formats interest rate as percentage', () => {
    const wrapper = mount(LoanList, { props: { loans: [sampleLoans[0]!] } })
    expect(wrapper.text()).toContain('8.0%')
  })
})
