package nz.co.acc.aep.common.history

/**
 * Wrapper class for each policy period of a member history.
 */
class MembershipPeriod {
  private var _productName : String as readonly ProductName
  private var _productCode: String as readonly ProductCode
  private var _financialYear : String as readonly FinancialYear
  private var _memberACCNumber: String as readonly MemberACCNumber
  private var _startDate : Date as readonly StartDate
  private var _endDate : Date as readonly EndDate
  private var _policyNumber : String as readonly PolicyNumber
  private var _accountName : String as readonly AccountName
  private var _jobType : String as readonly JobType
  private var _accountNumber : String as readonly AccountNumber
  private var _policyPeriod : PolicyPeriod as readonly Period
  private var _transactionDate : Date as readonly TransactionDate
  private var _newAEPCustomer : Boolean as readonly NewAEPCustomer
  private var _ceasedTrading : Boolean as readonly CeasedTrading

  construct(period : PolicyPeriod) {
    _policyPeriod = period
    var policy = _policyPeriod.Policy
    _productName = policy.Product.Name
    _productCode = policy.Product.Abbreviation
    var term = _policyPeriod.PolicyTerm
    _financialYear = term.AEPFinancialYear_ACC as String
    _memberACCNumber = term.AEPACCNumber_ACC
    _startDate = _policyPeriod.PeriodStart
    _endDate = calculateEndDate()
    _policyNumber = _policyPeriod.PolicyNumber
    _accountName = policy.Account.AccountHolderContact.DisplayName
    _accountNumber = policy.Account.ACCID_ACC
    _jobType = _policyPeriod.Job.DisplayType
    _transactionDate = period.EditEffectiveDate
    _newAEPCustomer = period.NewAEPCustomer_ACC
    _ceasedTrading = period?.CeasedTrading_ACC //Policy?.RewrittenToNewAccountDestination?.Periods?.first().CeasedTrading_ACC
  }

  private function calculateEndDate() : Date {
    var term = _policyPeriod.PolicyTerm
    if (term.findMostRecentPeriod().isCanceled())
      return term.findMostRecentPeriod().CancellationDate
    else
      return _policyPeriod.PeriodEnd
  }
}