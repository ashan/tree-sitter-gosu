package nz.co.acc.lob.common

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.lob.AbstractClassCodeSearchCriteria
uses entity.BusinessIndustryCode_ACC

/**
 * This class searches the Business Industry Code entity for the BIC/CU Admin screen.
 * Do not confuse this with BusinessIndustrySearchCriteria_ACC which is used for searching the BIC's
 * on the coverage screens.
 */
@Export
class BusinessIndustryCodeSearchCriteria_ACC extends AbstractClassCodeSearchCriteria<BusinessIndustryCode_ACC> {

  var _cuCode : String as CUCode
  var _bicCode : String as BICCode
  var _startDate : String as StartDate
  var _endDate : String as EndDate
  var _format = "dd/MM/yyyy"

  override protected function constructBaseQuery() : Query<BusinessIndustryCode_ACC> {
    var query = Query.make( BusinessIndustryCode_ACC )

    if (BICCode != null) {
      query.compare(BusinessIndustryCode_ACC#BusinessIndustryCode, Relop.Equals, BICCode)
    }

    if (CUCode != null) {
      query.join(BusinessIndustryCode_ACC#ClassificationUnit_ACC).compare(ClassificationUnit_ACC#ClassificationUnitCode, Relop.Equals, CUCode)
    }

    if (StartDate != null and EndDate != null) {
      query.compare(BusinessIndustryCode_ACC#StartDate, Relop.GreaterThanOrEquals, DateUtil_ACC.createDateFromString(StartDate, _format))
      query.compare(BusinessIndustryCode_ACC#EndDate, Relop.LessThanOrEquals, DateUtil_ACC.createDateFromString(EndDate, _format))
    }

    return query
  }
}
