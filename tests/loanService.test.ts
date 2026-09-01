import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getLoans,
  saveLoans,
  createLoanApplication,
  updateLoanStatus,
  calculateMonthlyPayment,
  autoDecideLoan
} from '../src/services/loanService'
import type { LoanApplication } from '../src/types/loan'

/**
 * In-memory localStorage mock used to isolate tests from the real browser API.
 * Replaced on `globalThis` via `Object.defineProperty` so every service call
 * that reads/writes `localStorage` operates on this controlled store.
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('loanService', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('getLoans', () => {
    /**
     * When localStorage contains no entry for `tredgate_loans`, `getLoans`
     * should return an empty array rather than null or undefined.
     */
    it('returns empty array when nothing is stored', () => {
      const loans = getLoans()
      expect(loans).toEqual([])
    })

    /**
     * When a valid JSON array has been persisted to localStorage, `getLoans`
     * should deserialise and return it with all fields intact.
     */
    it('returns stored loans', () => {
      const storedLoans: LoanApplication[] = [
        {
          id: '1',
          applicantName: 'John Doe',
          amount: 50000,
          termMonths: 24,
          interestRate: 0.08,
          status: 'pending',
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      ]
      localStorageMock.setItem('tredgate_loans', JSON.stringify(storedLoans))

      const loans = getLoans()
      expect(loans).toEqual(storedLoans)
    })
  })

  describe('saveLoans', () => {
    /**
     * `saveLoans` must serialise the array as JSON and call
     * `localStorage.setItem` with the key `tredgate_loans`.
     */
    it('saves loans to localStorage', () => {
      const loans: LoanApplication[] = [
        {
          id: '1',
          applicantName: 'Jane Doe',
          amount: 75000,
          termMonths: 36,
          interestRate: 0.06,
          status: 'approved',
          createdAt: '2024-02-01T00:00:00.000Z'
        }
      ]

      saveLoans(loans)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'tredgate_loans',
        JSON.stringify(loans)
      )
    })
  })

  describe('createLoanApplication', () => {
    /**
     * A valid input should produce a loan object with the supplied fields,
     * `status` set to `'pending'`, and auto-generated `id` and `createdAt`.
     */
    it('creates a new loan with pending status', () => {
      const input = {
        applicantName: 'Alice Smith',
        amount: 25000,
        termMonths: 12,
        interestRate: 0.05
      }

      const loan = createLoanApplication(input)

      expect(loan.applicantName).toBe('Alice Smith')
      expect(loan.amount).toBe(25000)
      expect(loan.termMonths).toBe(12)
      expect(loan.interestRate).toBe(0.05)
      expect(loan.status).toBe('pending')
      expect(loan.id).toBeDefined()
      expect(loan.createdAt).toBeDefined()
    })

    /**
     * An empty or whitespace-only applicant name must be rejected with a
     * descriptive error so the UI can surface it to the user.
     */
    it('throws error for empty applicant name', () => {
      expect(() =>
        createLoanApplication({
          applicantName: '',
          amount: 10000,
          termMonths: 12,
          interestRate: 0.05
        })
      ).toThrow('Applicant name is required')
    })

    /**
     * A loan amount of zero or below is not meaningful and must be rejected
     * with an appropriate validation error.
     */
    it('throws error for amount <= 0', () => {
      expect(() =>
        createLoanApplication({
          applicantName: 'John',
          amount: 0,
          termMonths: 12,
          interestRate: 0.05
        })
      ).toThrow('Amount must be greater than 0')
    })

    /**
     * A repayment term of zero or fewer months makes no financial sense and
     * must be rejected with an appropriate validation error.
     */
    it('throws error for termMonths <= 0', () => {
      expect(() =>
        createLoanApplication({
          applicantName: 'John',
          amount: 10000,
          termMonths: 0,
          interestRate: 0.05
        })
      ).toThrow('Term months must be greater than 0')
    })

    /**
     * A negative interest rate is invalid and must be rejected.
     * A rate of `0` (interest-free) is acceptable.
     */
    it('throws error for negative interest rate', () => {
      expect(() =>
        createLoanApplication({
          applicantName: 'John',
          amount: 10000,
          termMonths: 12,
          interestRate: -0.05
        })
      ).toThrow('Interest rate cannot be negative')
    })
  })

  describe('updateLoanStatus', () => {
    /**
     * Given an existing loan ID, `updateLoanStatus` should persist the new
     * status so that a subsequent `getLoans` call reflects the change.
     */
    it('updates loan status', () => {
      const loan: LoanApplication = {
        id: 'test-id',
        applicantName: 'Bob',
        amount: 50000,
        termMonths: 24,
        interestRate: 0.08,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
      saveLoans([loan])

      updateLoanStatus('test-id', 'approved')

      const loans = getLoans()
      expect(loans[0]?.status).toBe('approved')
    })

    /**
     * Attempting to update a loan that does not exist in storage must throw
     * an informative error so callers can handle the missing-resource case.
     */
    it('throws error for non-existent loan', () => {
      expect(() => updateLoanStatus('non-existent', 'approved')).toThrow(
        'Loan with id non-existent not found'
      )
    })
  })

  describe('calculateMonthlyPayment', () => {
    /**
     * For a $10,000 loan at 10% over 12 months the total is $11,000 and the
     * monthly instalment is approximately $916.67.
     * Uses the simple formula: `total = amount × (1 + rate)`, `monthly = total / term`.
     */
    it('calculates monthly payment correctly for basic case', () => {
      const loan: LoanApplication = {
        id: '1',
        applicantName: 'Test',
        amount: 10000,
        termMonths: 12,
        interestRate: 0.1, // 10%
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      // total = 10000 * 1.1 = 11000
      // monthly = 11000 / 12 = 916.666...
      const payment = calculateMonthlyPayment(loan)
      expect(payment).toBeCloseTo(916.67, 1)
    })

    /**
     * At 0% interest the total equals the principal, so the monthly payment
     * is simply `amount / termMonths`.
     */
    it('calculates monthly payment for 0% interest', () => {
      const loan: LoanApplication = {
        id: '1',
        applicantName: 'Test',
        amount: 12000,
        termMonths: 12,
        interestRate: 0,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      // total = 12000 * 1.0 = 12000
      // monthly = 12000 / 12 = 1000
      const payment = calculateMonthlyPayment(loan)
      expect(payment).toBe(1000)
    })

    /**
     * Verifies the formula scales correctly for a large, long-term loan:
     * $100,000 at 8% over 60 months yields $1,800/month.
     */
    it('calculates monthly payment for large loan', () => {
      const loan: LoanApplication = {
        id: '1',
        applicantName: 'Test',
        amount: 100000,
        termMonths: 60,
        interestRate: 0.08,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      // total = 100000 * 1.08 = 108000
      // monthly = 108000 / 60 = 1800
      const payment = calculateMonthlyPayment(loan)
      expect(payment).toBe(1800)
    })
  })

  describe('autoDecideLoan', () => {
    /**
     * A loan at exactly the boundary values (amount = $100,000, term = 60 months)
     * must be approved — the rule is `<=` not `<`.
     */
    it('approves loan when amount <= 100000 and termMonths <= 60', () => {
      const loan: LoanApplication = {
        id: 'auto-test',
        applicantName: 'Auto User',
        amount: 100000,
        termMonths: 60,
        interestRate: 0.08,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
      saveLoans([loan])

      autoDecideLoan('auto-test')

      const loans = getLoans()
      expect(loans[0]?.status).toBe('approved')
    })

    /**
     * A small, short-term loan well within both limits should be approved.
     */
    it('approves small, short-term loan', () => {
      const loan: LoanApplication = {
        id: 'small-loan',
        applicantName: 'Small Borrower',
        amount: 5000,
        termMonths: 6,
        interestRate: 0.05,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
      saveLoans([loan])

      autoDecideLoan('small-loan')

      const loans = getLoans()
      expect(loans[0]?.status).toBe('approved')
    })

    /**
     * When the requested amount exceeds $100,000 the loan must be rejected,
     * even if the repayment term is within the allowed range.
     */
    it('rejects loan when amount > 100000', () => {
      const loan: LoanApplication = {
        id: 'big-loan',
        applicantName: 'Big Borrower',
        amount: 150000,
        termMonths: 60,
        interestRate: 0.08,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
      saveLoans([loan])

      autoDecideLoan('big-loan')

      const loans = getLoans()
      expect(loans[0]?.status).toBe('rejected')
    })

    /**
     * When the repayment term exceeds 60 months the loan must be rejected,
     * even if the amount is within the allowed limit.
     */
    it('rejects loan when termMonths > 60', () => {
      const loan: LoanApplication = {
        id: 'long-loan',
        applicantName: 'Long Term Borrower',
        amount: 50000,
        termMonths: 72,
        interestRate: 0.08,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
      saveLoans([loan])

      autoDecideLoan('long-loan')

      const loans = getLoans()
      expect(loans[0]?.status).toBe('rejected')
    })

    /**
     * A loan that violates both the amount and term limits must still be
     * rejected — both conditions must be satisfied for approval.
     */
    it('rejects loan when both amount and termMonths exceed limits', () => {
      const loan: LoanApplication = {
        id: 'bad-loan',
        applicantName: 'Bad Borrower',
        amount: 200000,
        termMonths: 120,
        interestRate: 0.08,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
      saveLoans([loan])

      autoDecideLoan('bad-loan')

      const loans = getLoans()
      expect(loans[0]?.status).toBe('rejected')
    })

    /**
     * Calling `autoDecideLoan` with an ID that does not exist in storage must
     * throw an informative error so the caller can handle the missing-resource case.
     */
    it('throws error for non-existent loan', () => {
      expect(() => autoDecideLoan('non-existent')).toThrow(
        'Loan with id non-existent not found'
      )
    })
  })
})

