import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoanForm from '../src/components/LoanForm.vue'
import * as loanService from '../src/services/loanService'

vi.mock('../src/services/loanService', () => ({
  createLoanApplication: vi.fn()
}))

const mockCreate = vi.mocked(loanService.createLoanApplication)

describe('LoanForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all form fields', () => {
    const wrapper = mount(LoanForm)
    expect(wrapper.find('#applicantName').exists()).toBe(true)
    expect(wrapper.find('#amount').exists()).toBe(true)
    expect(wrapper.find('#termMonths').exists()).toBe(true)
    expect(wrapper.find('#interestRate').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('shows error when applicant name is empty', async () => {
    const wrapper = mount(LoanForm)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('.error-message').text()).toContain('Applicant name is required')
  })

  it('shows error when amount is missing', async () => {
    const wrapper = mount(LoanForm)
    await wrapper.find('#applicantName').setValue('Alice')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('.error-message').text()).toContain('Amount must be greater than 0')
  })

  it('shows error when termMonths is missing', async () => {
    const wrapper = mount(LoanForm)
    await wrapper.find('#applicantName').setValue('Alice')
    await wrapper.find('#amount').setValue(10000)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('.error-message').text()).toContain('Term months must be greater than 0')
  })

  it('shows error when interest rate is missing', async () => {
    const wrapper = mount(LoanForm)
    await wrapper.find('#applicantName').setValue('Alice')
    await wrapper.find('#amount').setValue(10000)
    await wrapper.find('#termMonths').setValue(12)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('.error-message').text()).toContain('Interest rate is required')
  })

  it('calls createLoanApplication with correct data on valid submit', async () => {
    mockCreate.mockReturnValue({
      id: 'new-id',
      applicantName: 'Alice',
      amount: 10000,
      termMonths: 12,
      interestRate: 0.05,
      status: 'pending',
      createdAt: new Date().toISOString()
    })

    const wrapper = mount(LoanForm)
    await wrapper.find('#applicantName').setValue('Alice')
    await wrapper.find('#amount').setValue(10000)
    await wrapper.find('#termMonths').setValue(12)
    await wrapper.find('#interestRate').setValue(0.05)
    await wrapper.find('form').trigger('submit')

    expect(mockCreate).toHaveBeenCalledWith({
      applicantName: 'Alice',
      amount: 10000,
      termMonths: 12,
      interestRate: 0.05
    })
  })

  it('emits created event after successful submission', async () => {
    mockCreate.mockReturnValue({
      id: 'new-id',
      applicantName: 'Alice',
      amount: 10000,
      termMonths: 12,
      interestRate: 0.05,
      status: 'pending',
      createdAt: new Date().toISOString()
    })

    const wrapper = mount(LoanForm)
    await wrapper.find('#applicantName').setValue('Alice')
    await wrapper.find('#amount').setValue(10000)
    await wrapper.find('#termMonths').setValue(12)
    await wrapper.find('#interestRate').setValue(0.05)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('created')).toBeTruthy()
  })

  it('resets form fields after successful submission', async () => {
    mockCreate.mockReturnValue({
      id: 'new-id',
      applicantName: 'Alice',
      amount: 10000,
      termMonths: 12,
      interestRate: 0.05,
      status: 'pending',
      createdAt: new Date().toISOString()
    })

    const wrapper = mount(LoanForm)
    await wrapper.find('#applicantName').setValue('Alice')
    await wrapper.find('#amount').setValue(10000)
    await wrapper.find('#termMonths').setValue(12)
    await wrapper.find('#interestRate').setValue(0.05)
    await wrapper.find('form').trigger('submit')

    expect((wrapper.find('#applicantName').element as HTMLInputElement).value).toBe('')
  })

  it('shows error message when createLoanApplication throws', async () => {
    mockCreate.mockImplementation(() => {
      throw new Error('Service error')
    })

    const wrapper = mount(LoanForm)
    await wrapper.find('#applicantName').setValue('Alice')
    await wrapper.find('#amount').setValue(10000)
    await wrapper.find('#termMonths').setValue(12)
    await wrapper.find('#interestRate').setValue(0.05)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('.error-message').text()).toContain('Service error')
  })

  it('does not show error message initially', () => {
    const wrapper = mount(LoanForm)
    expect(wrapper.find('.error-message').exists()).toBe(false)
  })
})
