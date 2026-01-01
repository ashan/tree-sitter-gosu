package nz.co.acc.lob.common

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.lob.AbstractClassCodeSearchCriteria

@Export
class BusinessIndustrySearchCriteria_ACC extends AbstractClassCodeSearchCriteria<BusinessIndustryCode_ACC> {

  var _exact : boolean as Exact
  var _bicCode : String as BICCode
  var _bicDescription : String as BICDescription
  var _cuCode : String as CUCode
  var _cuDescription : String as CUDescription
  var _startYear : Date as StartYear
  var _endYear : Date as EndYear
  
  override protected function constructBaseQuery() : Query<BusinessIndustryCode_ACC> {
    var query = Query.make( BusinessIndustryCode_ACC )

    if (BICCode != null) {
      if (Exact)
        query.compare("BusinessIndustryCode", Relop.Equals, BICCode.toString())
      else
        query.contains("BusinessIndustryCode", BICCode.toString(), true)
    }

    if( BICDescription != null) {
      query.contains("BusinessIndustryDescription", BICDescription.toString(), true)
    }

    if( CUCode != null) {
      query.join("ClassificationUnit_ACC").contains("ClassificationUnitCode", CUCode.toString(), true)
    }

    if( CUDescription != null) {
      query.join("ClassificationUnit_ACC").contains("ClassificationUnitDescription", CUDescription.toString(), true)
    }

    if (EndYear != null) {
      query.compare("StartDate", Relop.LessThanOrEquals, StartYear)
      query.compare("EndDate", Relop.GreaterThanOrEquals, EndYear)
    }

    return query
  }
}
