package nz.co.acc.aep.member.history.ui

uses gw.api.filters.StandardBeanFilter
uses nz.co.acc.aep.common.history.MembershipTerm
uses nz.co.acc.aep.common.history.MembershipHistory

/**
 * Created by madhav.mandayam on 18-May-17.
 */
class UIHelper {
  var _membershipHistory : MembershipHistory
  var _membershipTerms : nz.co.acc.aep.common.history.MembershipTerm[] as MembershipTerms
  var _showDetailPanel : boolean as ShowDetailPanel

  construct(_account : Account) {
    _membershipHistory = MembershipHistory.withAllTermsFor(_account)
    _membershipTerms = _membershipHistory.Terms.toTypedArray()
    _showDetailPanel = false
  }

  property get ProductFilter(): StandardBeanFilter[] {
    var productFilter = new ArrayList<StandardBeanFilter>();
    var productNames = new TreeSet<String>(_membershipHistory.Terms.map(\elt -> elt.ProductName))
    for (productName in productNames) {
      var filter = new StandardBeanFilter(productName, \x -> (x as MembershipTerm).ProductName == productName)
      productFilter.add(filter)
    }
    return productFilter.toTypedArray()
  }

  property get FinancialYearFilter(): StandardBeanFilter[] {
    var financialYearFilter = new ArrayList<StandardBeanFilter>();
    var financialYears = new TreeSet<String>(_membershipHistory.Terms.map(\elt -> elt.FinancialYear))
    for (financialYear in financialYears) {
      var filter = new StandardBeanFilter(financialYear, \x -> (x as MembershipTerm).FinancialYear == financialYear)
      financialYearFilter.add(filter)
    }
    return financialYearFilter.toTypedArray()
  }

  public static function getTransaction(term : MembershipTerm) : String {
    var periodsInTerm = term.Periods
    if (periodsInTerm.size() > 1)
      return periodsInTerm.first().JobType + " --> " + periodsInTerm.last().JobType
    else
      return periodsInTerm.last().JobType
  }

  public static function getAEPProgram(term : MembershipTerm) : String {
    var periodsInTerm = term.Periods
    if (periodsInTerm.last().Period.Policy.Account.AEPContractAccount_ACC)
      return term.AccountName
    else
      return "-"
  }

}