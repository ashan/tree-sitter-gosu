package nz.co.acc.aep.master.history.ui

uses gw.api.filters.StandardBeanFilter
uses nz.co.acc.aep.common.history.MembershipTerm
uses nz.co.acc.aep.common.history.MembershipHistory

uses java.text.SimpleDateFormat

/**
 * Created by madhav.mandayam on 18-May-17.
 */
class UIHelper {
  var _membershipHistory : MembershipHistory
  var _membershipTerms : List<nz.co.acc.aep.common.history.MembershipTerm>
  var _showDetailPanel : boolean as ShowDetailPanel
  var _filterDate : Date as FilterDate
  var _isFinancialYearFilterEditable: Boolean as FinancialYearFilterEditable
  var _contractPeriod : PolicyPeriodSummary

  construct(account : Account, contractPeriod : PolicyPeriodSummary) {
    _membershipHistory = MembershipHistory.withAllTermsFor(account)
    _membershipTerms = _membershipHistory.Terms
                        .orderBy(\elt -> elt.StartDate)
                        .thenBy(\elt -> elt.Periods.last().Period.CreateTime)
    _showDetailPanel = false
    _contractPeriod = contractPeriod
    if (contractPeriod == null)
      _isFinancialYearFilterEditable = true
    else {
      _filterDate = null
      _isFinancialYearFilterEditable = false
      filterTermsByContractPeriod()
    }
  }

  construct(account : Account) {
    this(account, null)
  }

  property get MembershipTerms() : nz.co.acc.aep.common.history.MembershipTerm[] {
    return _membershipTerms.toTypedArray()
  }

  property get ProductFilter(): StandardBeanFilter[] {
    var productFilter = new ArrayList<StandardBeanFilter>();
    var productNames = new TreeSet<String>(_membershipTerms.map(\elt -> elt.ProductName))
    for (productName in productNames) {
      var filter = new StandardBeanFilter(productName, \x -> (x as MembershipTerm).ProductName == productName)
      productFilter.add(filter)
    }
    return productFilter.toTypedArray()
  }

  property get FinancialYearFilter(): StandardBeanFilter[] {
    var financialYearFilter = new ArrayList<StandardBeanFilter>();
    var financialYears = new TreeSet<String>(_membershipTerms.map(\elt -> elt.FinancialYear))
    for (financialYear in financialYears) {
      var filter = new StandardBeanFilter(financialYear, \x -> (x as MembershipTerm).FinancialYear == financialYear)
      financialYearFilter.add(filter)
    }
    return financialYearFilter.toTypedArray()
  }

  property get MemberACCNumberFilter(): StandardBeanFilter[] {
    var memberACCNumberFilter = new ArrayList<StandardBeanFilter>();
    var memberACCNumbers = new TreeSet<String>(_membershipTerms.map(\elt -> elt.MemberACCNumber))
    for (memberACCNumber in memberACCNumbers) {
      var filter = new StandardBeanFilter(memberACCNumber, \x -> (x as MembershipTerm).MemberACCNumber == memberACCNumber)
      memberACCNumberFilter.add(filter)
    }
    return memberACCNumberFilter.toTypedArray()
  }


  function filterTermsByDate(filterDate: Date) {
    if (filterDate != null) {
      filterDate = filterDate.addHours(1)
      _membershipTerms = _membershipTerms
          .where(\elt -> filterDate >= elt.StartDate and filterDate <= elt.EndDate)
    }
    else
      filterTermsByContractPeriod()
  }

  function filterTermsByContractPeriod() {
    if (_contractPeriod != null) {
      _membershipTerms = _membershipHistory.Terms
          .where(\elt -> elt.StartDate >= _contractPeriod.PeriodStart and elt.StartDate < _contractPeriod.PeriodEnd)
    }
    else
      _membershipTerms = _membershipHistory.Terms
  }

  public static function getTransaction(term : MembershipTerm) : String {
    var periodsInTerm = term.Periods
    if (periodsInTerm.size() > 1)
      return periodsInTerm.first().JobType + " --> " + periodsInTerm.last().JobType
    else
      return periodsInTerm.last().JobType
  }

  static function getAEPMasterHistoryWorksheetTitle(contractPeriod : PolicyPeriodSummary) : String {
    if (contractPeriod != null) {
      var sdf = new SimpleDateFormat("dd/MM/yyyy")
      return "Member Detail (" +
              sdf.format(contractPeriod.PeriodStart) + " - " +
              sdf.format(contractPeriod.PeriodEnd) + ")"
    }
    else
      return "AEP Master History"
  }
}