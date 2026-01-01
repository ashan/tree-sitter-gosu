package nz.co.acc.aep.common.history

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.util.DateUtil
uses typekey.Contact

/**
 * Wrapper class for each policy period of a member history.
 */
class MembershipTerm {
  private var _productName: String as ProductName
  private var _productCode: String as ProductCode
  private var _financialYear: String as FinancialYear
  private var _memberACCNumber: String as MemberACCNumber
  private var _startDate: Date as StartDate
  private var _endDate: Date as EndDate
  private var _policyNumber: String as PolicyNumber
  private var _accountName: String as AccountName
  private var _description: String as Description
  private var _termDays: Integer as TermDays
  private var _periods: List<MembershipPeriod>as Periods
  private var _newAEPCustomer : Boolean as NewAEPCustomer
  private var _ceasedTrading : Boolean as CeasedTrading


  construct(periodsInTerm: List<MembershipPeriod>) {
    _periods = periodsInTerm
    _startDate = periodsInTerm.first().StartDate
    _endDate = periodsInTerm.last().EndDate
    _productName = periodsInTerm.last().ProductName
    _productCode = periodsInTerm.last().ProductCode
    _memberACCNumber = periodsInTerm.last().MemberACCNumber
    _financialYear = periodsInTerm.last().FinancialYear
    _policyNumber = periodsInTerm.last().PolicyNumber
    _accountName = periodsInTerm.last().AccountName
    _termDays = DateUtil.differenceInDays(_startDate, _endDate)
    _newAEPCustomer = periodsInTerm.last().NewAEPCustomer
    _ceasedTrading = periodsInTerm.last().CeasedTrading
  }

  property get MemberAccount() : Account {
    var memberAccount = Query.make(Account)
                        .compare("ACCID_ACC", Relop.Equals, _memberACCNumber)
                        .select().firstWhere(\elt -> elt.AccountHolderContact.Subtype == Contact.TC_COMPANY)

    if (memberAccount == null)
      throw "No account found with ACC Number - ${_memberACCNumber}"

    return memberAccount
  }

  /**
   * This property returns the latest 'Final Audit' period for the term if it exists. If it doesn't,
   * then the latest bound period for the term is returned.
   * @return the latest final audit period if it exists or else the latest bound period.
   */
  property get RelevantPeriod() : MembershipPeriod {
    var finalAuditPeriod = this.Periods
                            ?.where(\p -> p.Period.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE)
                            ?.orderBy(\p -> p.Period.UpdateTime)?.last()
    if (finalAuditPeriod != null)
      return finalAuditPeriod

    return this.Periods?.orderBy(\p -> p.Period.UpdateTime)?.last()
  }

  function getRelevantPeriod(isFinalAudit : boolean)  : MembershipPeriod {
    if (isFinalAudit)
      return RelevantPeriod

    return this.Periods
            ?.where(\p -> p.Period.Status == PolicyPeriodStatus.TC_BOUND)
            ?.where(\p -> p.Period.Job.Subtype != typekey.Job.TC_CANCELLATION) // DE1110 - exclude cancelled jobs
            ?.orderBy(\p -> p.Period.UpdateTime)?.last()
  }

  function getMemberAccountName() : String {
    return RelevantPeriod?.Period?.Policy?.RewrittenToNewAccountSource?.Account?.AccountHolderContact?.DisplayName
  }

}