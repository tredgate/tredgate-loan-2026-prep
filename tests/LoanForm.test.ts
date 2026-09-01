import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoanForm from '../src/components/LoanForm.vue'
import * as loanService from '../src/services/loanService'

/**
 * The entire `loanService` module is replaced with a vi.mock() stub so that
 * LoanForm tests do not depend on localStorage or business-logic side-effects.
 * Individual tests configure `mockCreate` as needed.
 */
vi.mock('../src/services/loanService', () => ({
  createLoanApplication: vi.fn()
}))

const mockCreate = vi.mocked(loanService.createLoanApplication)

describe('LoanForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Ensures the form template renders all four input fields and the submit
   * button, so users can fill in every required piece of data.
   */
  it('renders all form fields', () => {
    const wrapper = mount(LoanForm)
    expect(wrapper.find('#applicantName').exists()).toBe(true)
    expect(wrapper.find('#amount').exists()).toBe(true)
    expect(wrapper.find('#termMonths').exists()).toBe(true)
    expect(wrapper.find('#interestRate').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  /**
   * Submitting the form with no applicant name must display a validation
   * error without calling the service.
   */
  it('shows error when applicant name is empty', async () => {
    const wrapper = mount(LoanForm)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('.error-message').text()).toContain('Applicant name is required')
  })

  /**
   * After a valid name is entered but the amount field is left blank,
   * submitting must display a validation error for the amount.
   */
  it('shows error when amount is missing', async () => {
    const wrapper = mount(LoanForm)
    await wrapper.find('#applicantName').setValue('Alice')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('.error-message').text()).toContain('Amount must be greater than 0')
  })

  /**
   * After name and amount are filled in but termMonths is blank, submitting
   * must display a validation error for the repayment term.
   */
  it('shows error when termMonths is missing', async () => {
    const wrapper = mount(LoanForm)
    await wrapper.find('#applicantName').setValue('Alice')
    await wrapper.find('#amount').setValue(10000)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('.error-message').text()).toContain('Term months must be greater than 0')
  })

  /**
   * After name, amount, and term are filled in but interestRate is blank,
   * submitting must display a validation error for the interest rate.
   */
  it('shows error when interest rate is missing', async () => {
    const wrapper = mount(LoanForm)
    await wrapper.find('#applicantName').setValue('Alice')
    await wrapper.find('#amount').setValue(10000)
    await wrapper.find('#termMonths').setValue(12)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('.error-message').text()).toContain('Interest rate is required')
  })

  /**
   * When all fields are valid, `createLoanApplication` must be called exactly
   * once with the values the user entered (name is trimmed by the component).
   */
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

  /**
   * After a successful submission the component must emit the `created` event
   * so parent components can refresh the loan list.
   */
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

  /**
   * After a successful submission all form fields must be cleared so the user
   * can immediately start entering a new application.
   */
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

  /**
   * If `createLoanApplication` throws (e.g. a service-layer validation
   * error), the component must catch it and display the error message in the
   * form rather than crashing the page.
   */
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

  /**
   * The error message element must not be rendered at all on initial mount,
   * ensuring a clean form appearance before the user interacts.
   */
  it('does not show error message initially', () => {
    const wrapper = mount(LoanForm)
    expect(wrapper.find('.error-message').exists()).toBe(false)
  })
})

