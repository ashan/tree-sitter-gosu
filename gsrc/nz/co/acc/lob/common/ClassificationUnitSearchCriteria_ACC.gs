package nz.co.acc.lob.common

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.lob.AbstractClassCodeSearchCriteria

/**
 * This class searches the Classification Unit entity for the BIC/CU Admin screen.
 */
@Export
class ClassificationUnitSearchCriteria_ACC extends AbstractClassCodeSearchCriteria<ClassificationUnit_ACC> {

  var _cuCode : String as CUCode
  var _startDate : String as StartDate
  var _endDate : String as EndDate
  var _format = "dd/MM/yyyy"

  override protected function constructBaseQuery() : Query<ClassificationUnit_ACC> {
    var query = Query.make(ClassificationUnit_ACC)

    if (CUCode != null) {
      query.compare(ClassificationUnit_ACC#ClassificationUnitCode, Relop.Equals, CUCode)
    }

    if (StartDate != null and EndDate != null) {
      query.compare(ClassificationUnit_ACC#StartDate, Relop.GreaterThanOrEquals, DateUtil_ACC.createDateFromString(StartDate, _format))
      query.compare(ClassificationUnit_ACC#EndDate, Relop.LessThanOrEquals, DateUtil_ACC.createDateFromString(EndDate, _format))
    }

    return query
  }
}
