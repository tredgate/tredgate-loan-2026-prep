import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoanList from '../src/components/LoanList.vue'
import type { LoanApplication } from '../src/types/loan'

const pendingLoan: LoanApplication = {
  id: 'loan-1',
  applicantName: 'Alice',
  amount: 10000,
  termMonths: 12,
  interestRate: 0.1,
  status: 'pending',
  createdAt: '2024-06-15T00:00:00.000Z'
}

const approvedLoan: LoanApplication = {
  ...pendingLoan,
  id: 'loan-2',
  applicantName: 'Bob',
  status: 'approved'
}

const rejectedLoan: LoanApplication = {
  ...pendingLoan,
  id: 'loan-3',
  applicantName: 'Carol',
  status: 'rejected'
}

describe('LoanList', () => {
  it('shows empty state when no loans provided', () => {
    const wrapper = mount(LoanList, { props: { loans: [] } })
    expect(wrapper.text()).toContain('No loan applications yet')
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('renders a table when loans are provided', () => {
    const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.find('.empty-state').exists()).toBe(false)
  })

  it('displays applicant name and amount', () => {
    const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('10,000')
  })

  it('shows approve, reject, and auto-decide buttons for pending loans', () => {
    const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
    const buttons = wrapper.findAll('.action-btn')
    expect(buttons).toHaveLength(3)
  })

  it('hides action buttons for approved loans', () => {
    const wrapper = mount(LoanList, { props: { loans: [approvedLoan] } })
    expect(wrapper.findAll('.action-btn')).toHaveLength(0)
    expect(wrapper.find('.no-actions').exists()).toBe(true)
  })

  it('hides action buttons for rejected loans', () => {
    const wrapper = mount(LoanList, { props: { loans: [rejectedLoan] } })
    expect(wrapper.findAll('.action-btn')).toHaveLength(0)
  })

  it('emits approve event when approve button clicked', async () => {
    const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
    await wrapper.find('.action-btn.success').trigger('click')
    expect(wrapper.emitted('approve')).toBeTruthy()
    expect(wrapper.emitted('approve')?.[0]).toEqual(['loan-1'])
  })

  it('emits reject event when reject button clicked', async () => {
    const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
    await wrapper.find('.action-btn.danger').trigger('click')
    expect(wrapper.emitted('reject')).toBeTruthy()
    expect(wrapper.emitted('reject')?.[0]).toEqual(['loan-1'])
  })

  it('emits autoDecide event when auto-decide button clicked', async () => {
    const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
    await wrapper.find('.action-btn.secondary').trigger('click')
    expect(wrapper.emitted('autoDecide')).toBeTruthy()
    expect(wrapper.emitted('autoDecide')?.[0]).toEqual(['loan-1'])
  })

  it('shows status badge with correct class', () => {
    const wrapper = mount(LoanList, { props: { loans: [pendingLoan, approvedLoan, rejectedLoan] } })
    expect(wrapper.find('.status-pending').exists()).toBe(true)
    expect(wrapper.find('.status-approved').exists()).toBe(true)
    expect(wrapper.find('.status-rejected').exists()).toBe(true)
  })

  it('displays monthly payment column', () => {
    // For $10000, 10% rate, 12 months: total = 11000, monthly = 916.67
    const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
    expect(wrapper.text()).toContain('916')
  })

  it('renders multiple loans', () => {
    const loans = [pendingLoan, approvedLoan, rejectedLoan]
    const wrapper = mount(LoanList, { props: { loans } })
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(3)
  })

  describe('formatCurrency', () => {
    it('formats amount as USD currency in the table', () => {
      const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
      expect(wrapper.text()).toContain('$10,000.00')
    })
  })

  describe('formatPercent', () => {
    it('displays interest rate as percentage', () => {
      const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
      expect(wrapper.text()).toContain('10.0%')
    })
  })

  describe('formatDate', () => {
    it('formats created date in readable format', () => {
      const wrapper = mount(LoanList, { props: { loans: [pendingLoan] } })
      // 2024-06-15 should show "Jun 15, 2024" or similar
      expect(wrapper.text()).toMatch(/Jun[\s\S]*2024/)
    })
  })
})
