package nz.co.acc.aep.master.contractpolicy.ui

uses gw.api.filters.StandardBeanFilter

/**
 * Created by madhav.mandayam on 08-Jun-17.
 */
class MemberLiableEarningsUIHelper {
  private var _memberDetailLiabileEarnings : List<AEPMemberCUData_ACC> as readonly MemberDetailLiableEarnings
  private var _summaryOfMemberLiableEarningsByCU : List<AEPRateableCUData_ACC> as readonly SummaryOfMemberLiableEarningsByCU
  private var _aepLine : AEPLine_ACC

  construct(aepLine : AEPLine_ACC) {
    _aepLine = aepLine
    loadMemberDetailLiableEarnings()
    loadSummaryOfMemberLiableEarningsByCU()
  }

  private function loadMemberDetailLiableEarnings() {
    _memberDetailLiabileEarnings = _aepLine.AEPMemberData*.AEPMemberCUData
                                    .where(\cuData -> cuData.AEPMemberData.TermDaysForProration > 0)
                                    .orderBy(\cuData -> cuData.AEPMemberData.ACCNumber)
                                    .thenBy(\cuData -> cuData.AEPMemberData.ProductCode)
                                    .thenBy(\cuData -> cuData.CUCode)
  }

  private function loadSummaryOfMemberLiableEarningsByCU() {
      _summaryOfMemberLiableEarningsByCU = _aepLine.AEPRateableCUData
                                            .orderBy(\cuData -> cuData.CUCode)
  }

  property get ACCNumberFilter() : StandardBeanFilter[] {
    var accNumberFilter = new ArrayList<StandardBeanFilter>()
    var orderedACCNumber = _memberDetailLiabileEarnings
                          .map(\elt -> elt.AEPMemberData.ACCNumber)
                          .order()
    var accNumberSet = new TreeSet<String>(orderedACCNumber)
    for (accNumber in accNumberSet) {
      var filter = new StandardBeanFilter(accNumber, \x -> getACCNumber(x as AEPMemberCUData_ACC) == accNumber)
      accNumberFilter.add(filter)
    }
    return accNumberFilter.toTypedArray()
  }

  private function getACCNumber(cuData : AEPMemberCUData_ACC) : String {
    return cuData.AEPMemberData.ACCNumber
  }

  property get DetailCUCodeFilter() : StandardBeanFilter[] {
    var cuCodeFilter = new ArrayList<StandardBeanFilter>()
    var cuCodeSet = new TreeSet<String>(_memberDetailLiabileEarnings.map(\elt -> elt.CUCode).order())
    for (cuCode in cuCodeSet) {
      var filter = new StandardBeanFilter(cuCode, \x -> (x as AEPMemberCUData_ACC).CUCode == cuCode)
      cuCodeFilter.add(filter)
    }
    return cuCodeFilter.toTypedArray()
  }

  property get SummaryCUCodeFilter() : StandardBeanFilter[] {
    var cuCodeFilter = new ArrayList<StandardBeanFilter>()
    var cuCodeSet = new TreeSet<String>(_summaryOfMemberLiableEarningsByCU.map(\elt -> elt.CUCode).order())
    for (cuCode in cuCodeSet) {
      var filter = new StandardBeanFilter(cuCode, \x -> (x as AEPRateableCUData_ACC).CUCode == cuCode)
      cuCodeFilter.add(filter)
    }
    return cuCodeFilter.toTypedArray()
  }

  function isFinalAudit() : boolean {
    return (_aepLine.Branch.Job typeis Audit)
  }

  property get LiableEarningsLabel() : String {
    if (isFinalAudit())
      return "Liable Earnings"
    else
      return "Adjusted Liable Earnings"
  }

  property get ProratedLiableEarningsLabel() : String {
    if (isFinalAudit())
      return "Prorated Liable Earnings"
    else
      return "Prorated Adjusted Liable Earnings"
  }
}