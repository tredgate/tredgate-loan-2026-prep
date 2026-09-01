import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoanSummary from '../src/components/LoanSummary.vue'
import type { LoanApplication } from '../src/types/loan'

const makeLoans = (overrides: Partial<LoanApplication>[] = []): LoanApplication[] =>
  overrides.map((o, i) => ({
    id: String(i + 1),
    applicantName: 'Test User',
    amount: 10000,
    termMonths: 12,
    interestRate: 0.05,
    status: 'pending' as const,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...o
  }))

describe('LoanSummary', () => {
  it('shows zeros for all stats when no loans', () => {
    const wrapper = mount(LoanSummary, { props: { loans: [] } })
    const text = wrapper.text()
    expect(text).toContain('0')
  })

  it('shows correct total applications count', () => {
    const loans = makeLoans([{}, {}, {}])
    const wrapper = mount(LoanSummary, { props: { loans } })
    const statCards = wrapper.findAll('.stat-card')
    expect(statCards[0]?.find('.stat-value').text()).toBe('3')
  })

  it('shows correct pending count', () => {
    const loans = makeLoans([
      { status: 'pending' },
      { status: 'pending' },
      { status: 'approved' }
    ])
    const wrapper = mount(LoanSummary, { props: { loans } })
    const statCards = wrapper.findAll('.stat-card')
    expect(statCards[1]?.find('.stat-value').text()).toBe('2')
  })

  it('shows correct approved count', () => {
    const loans = makeLoans([
      { status: 'approved' },
      { status: 'approved' },
      { status: 'rejected' }
    ])
    const wrapper = mount(LoanSummary, { props: { loans } })
    const statCards = wrapper.findAll('.stat-card')
    expect(statCards[2]?.find('.stat-value').text()).toBe('2')
  })

  it('shows correct rejected count', () => {
    const loans = makeLoans([
      { status: 'approved' },
      { status: 'rejected' },
      { status: 'rejected' }
    ])
    const wrapper = mount(LoanSummary, { props: { loans } })
    const statCards = wrapper.findAll('.stat-card')
    expect(statCards[3]?.find('.stat-value').text()).toBe('2')
  })

  it('shows correct total approved amount', () => {
    const loans = makeLoans([
      { status: 'approved', amount: 30000 },
      { status: 'approved', amount: 20000 },
      { status: 'rejected', amount: 50000 }
    ])
    const wrapper = mount(LoanSummary, { props: { loans } })
    const statCards = wrapper.findAll('.stat-card')
    // 30000 + 20000 = 50000, formatted as $50,000
    expect(statCards[4]?.find('.stat-value').text()).toContain('$50,000')
  })

  it('shows $0 total approved when no approved loans', () => {
    const loans = makeLoans([{ status: 'pending' }, { status: 'rejected' }])
    const wrapper = mount(LoanSummary, { props: { loans } })
    const statCards = wrapper.findAll('.stat-card')
    expect(statCards[4]?.find('.stat-value').text()).toContain('$0')
  })

  it('renders five stat cards', () => {
    const wrapper = mount(LoanSummary, { props: { loans: [] } })
    expect(wrapper.findAll('.stat-card')).toHaveLength(5)
  })

  it('stat cards have correct labels', () => {
    const wrapper = mount(LoanSummary, { props: { loans: [] } })
    const labels = wrapper.findAll('.stat-label').map(l => l.text())
    expect(labels).toContain('Total Applications')
    expect(labels).toContain('Pending')
    expect(labels).toContain('Approved')
    expect(labels).toContain('Rejected')
    expect(labels).toContain('Total Approved')
  })

  it('reacts to updated loan props', async () => {
    const loans = makeLoans([{ status: 'pending' }])
    const wrapper = mount(LoanSummary, { props: { loans } })
    expect(wrapper.findAll('.stat-card')[0]?.find('.stat-value').text()).toBe('1')

    await wrapper.setProps({ loans: makeLoans([{}, {}, {}]) })
    expect(wrapper.findAll('.stat-card')[0]?.find('.stat-value').text()).toBe('3')
  })
})
