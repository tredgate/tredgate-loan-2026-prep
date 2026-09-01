import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoanForm from '../src/components/LoanForm.vue'
import * as loanService from '../src/services/loanService'

vi.mock('../src/services/loanService', () => ({
  createLoanApplication: vi.fn()
}))

const mockCreateLoanApplication = vi.mocked(loanService.createLoanApplication)

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

  it('shows error when applicant name is empty on submit', async () => {
    const wrapper = mount(LoanForm)

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.find('.error-message').text()).toBe('Applicant name is required')
  })

  it('shows error when amount is 0 or missing', async () => {
    const wrapper = mount(LoanForm)

    await wrapper.find('#applicantName').setValue('John')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.find('.error-message').text()).toBe('Amount must be greater than 0')
  })

  it('shows error when term months is 0 or missing', async () => {
    const wrapper = mount(LoanForm)

    await wrapper.find('#applicantName').setValue('John')
    await wrapper.find('#amount').setValue(10000)
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.find('.error-message').text()).toBe('Term months must be greater than 0')
  })

  it('shows error when interest rate is missing', async () => {
    const wrapper = mount(LoanForm)

    await wrapper.find('#applicantName').setValue('John')
    await wrapper.find('#amount').setValue(10000)
    await wrapper.find('#termMonths').setValue(12)
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.find('.error-message').text()).toBe(
      'Interest rate is required and cannot be negative'
    )
  })

  it('calls createLoanApplication with valid input and emits created event', async () => {
    mockCreateLoanApplication.mockReturnValueOnce({
      id: 'abc',
      applicantName: 'John',
      amount: 10000,
      termMonths: 12,
      interestRate: 0.05,
      status: 'pending',
      createdAt: '2024-01-01T00:00:00.000Z'
    })

    const wrapper = mount(LoanForm)

    await wrapper.find('#applicantName').setValue('John')
    await wrapper.find('#amount').setValue(10000)
    await wrapper.find('#termMonths').setValue(12)
    await wrapper.find('#interestRate').setValue(0.05)
    await wrapper.find('form').trigger('submit.prevent')

    expect(mockCreateLoanApplication).toHaveBeenCalledWith({
      applicantName: 'John',
      amount: 10000,
      termMonths: 12,
      interestRate: 0.05
    })
    expect(wrapper.emitted('created')).toBeTruthy()
  })

  it('resets form fields after successful submission', async () => {
    mockCreateLoanApplication.mockReturnValueOnce({
      id: 'abc',
      applicantName: 'John',
      amount: 10000,
      termMonths: 12,
      interestRate: 0.05,
      status: 'pending',
      createdAt: '2024-01-01T00:00:00.000Z'
    })

    const wrapper = mount(LoanForm)

    await wrapper.find('#applicantName').setValue('John')
    await wrapper.find('#amount').setValue(10000)
    await wrapper.find('#termMonths').setValue(12)
    await wrapper.find('#interestRate').setValue(0.05)
    await wrapper.find('form').trigger('submit.prevent')

    expect((wrapper.find('#applicantName').element as HTMLInputElement).value).toBe('')
  })

  it('shows error message when createLoanApplication throws', async () => {
    mockCreateLoanApplication.mockImplementationOnce(() => {
      throw new Error('Amount must be greater than 0')
    })

    const wrapper = mount(LoanForm)

    await wrapper.find('#applicantName').setValue('John')
    await wrapper.find('#amount').setValue(10000)
    await wrapper.find('#termMonths').setValue(12)
    await wrapper.find('#interestRate').setValue(0.05)
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.find('.error-message').text()).toBe('Amount must be greater than 0')
  })

  it('does not show error message initially', () => {
    const wrapper = mount(LoanForm)
    expect(wrapper.find('.error-message').exists()).toBe(false)
  })
})
