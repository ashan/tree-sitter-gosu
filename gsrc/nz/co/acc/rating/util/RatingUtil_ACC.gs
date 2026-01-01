package nz.co.acc.rating.util

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey

uses java.math.BigDecimal

/**
 * Util class for the rating code.
 */
class RatingUtil_ACC {

  public static function findClassificationUnit(classificationUnitCode : String, startDate : Date, endDate : Date) : ClassificationUnit_ACC {
    var query = Query.make(ClassificationUnit_ACC)
    query.compare(ClassificationUnit_ACC#ClassificationUnitCode, Equals, classificationUnitCode)
    query.compare(ClassificationUnit_ACC#StartDate, Equals, startDate)
    query.compare(ClassificationUnit_ACC#EndDate, Equals, endDate)
    var result = query.select().AtMostOneRow
    return result
  }

  public static function findClassificationUnitsForLevyYear(startDate : Date, endDate : Date) : List<ClassificationUnit_ACC> {
    var query = Query.make(ClassificationUnit_ACC)
    query.compare(ClassificationUnit_ACC#StartDate, Equals, startDate)
    query.compare(ClassificationUnit_ACC#EndDate, Equals, endDate)
    var result = query.select().toList()
    return result
  }

  public static function findAllClassificationUnits() : List<ClassificationUnit_ACC> {
    var query = Query.make(ClassificationUnit_ACC)
    var result = query.select().toList()
    return result
  }

  public static function findAllClassificationUnitsBeforeLevyEndDate(levyEndDate : Date) : List<ClassificationUnit_ACC> {
    var query = Query.make(ClassificationUnit_ACC)
    query.compare(ClassificationUnit_ACC#EndDate, LessThanOrEquals, levyEndDate)
    var result = query.select().toList()
    return result
  }

  public static function validateRate(rate:BigDecimal) : String {
    if ( rate != null) {
      if(!(rate > -100 and rate < 100)) {
        return DisplayKey.get("Web.Rating.Errors.RateNotInRange")
      }
    }
    return null
  }
}
