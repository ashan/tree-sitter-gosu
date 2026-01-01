package gw.rating.rtm.query

uses gw.api.database.Query
uses gw.api.database.Relop

uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * Created by andy on 1/05/2017.
 */
class GSTUtil_ACC {

  construct() {
  }

  /**
   * Gather GST Amount for the passed date
   * @param gstDate the date to check what GST rate was for
   * @return GST Amount
   */
  private static function getGstRate_ACC(gstDate : Date) : BigDecimal {
    // Get GST Amount
    var query = Query.make(GSTRate_ACC)
        .compare(GSTRate_ACC#EndDate, Relop.GreaterThanOrEquals, gstDate)
        .compare(GSTRate_ACC#StartDate, Relop.LessThanOrEquals, gstDate)

    return query.select().FirstResult.getRate()

  }

  /**
   * Get GST Amount
   * @param changeAmount
   * @return The new amount with GST Included
   */
  public static function getGSTFromAmount_ACC(amount: double) : BigDecimal {
    return getGSTFromAmount_ACC(amount, Date.Now)
  }

  /**
   * Get GST Amount
   * @param changeAmount
   * @param periodDate GST Rate is for
   * @return The new amount with GST Included
   */
  public static function getGSTFromAmount_ACC(amount: double, gstDate : Date) : BigDecimal {
    return amount - subtractGSTFromAmount_ACC(amount, gstDate)
  }


  /**
   * Add GST Amount
   * @param changeAmount
   * @return The new amount with GST Included
   */
  public static function addGSTToAmount_ACC(exclusiveAmount: double) : BigDecimal {
    return addGSTToAmount_ACC(exclusiveAmount, Date.Now)
  }

  /**
   * Add GST Amount
   * @param changeAmount
   * @param periodDate GST Rate is for
   * @return The new amount with GST Included
   */
  public static function addGSTToAmount_ACC(exclusiveAmount: double, gstDate : Date) : BigDecimal {
    // Get GST Amount
    var result = getGstRate_ACC(gstDate)

    return (exclusiveAmount * ( 1 + result )).setScale(2, RoundingMode.HALF_UP)
  }



  /**
   * subtract GST Amount
   * @param changeAmount
   * @return The new amount with GST Excluded
   */
  public static function subtractGSTFromAmount_ACC(inclusiveAmount: double) : BigDecimal {
    return subtractGSTFromAmount_ACC(inclusiveAmount, Date.Now)
  }

  /**
   * subtract GST Amount
   * @param changeAmount
   * @param periodDate GST Rate is for
   * @return The new amount with GST Excluded
   */
  public static function subtractGSTFromAmount_ACC(inclusiveAmount: double, gstDate : Date) : BigDecimal {
    // Get GST Amount
    var result = getGstRate_ACC(gstDate)

    return (inclusiveAmount / (1 + result)).setScale(2, RoundingMode.HALF_UP)
  }
}