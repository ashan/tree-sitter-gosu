package nz.co.acc.gwer.bulkupload.row

uses java.math.BigDecimal

/**
 * Created by HamblyAl on 18/03/2019.
 */
class ERClaimsCalcExclusionRow extends AbstractXLSRow {
  public var levyApplicationYear : Integer as LevyApplicationYear = null
  public var claimsType : String as ClaimsType = null
  public var excludeFromCalc : Boolean as ExcludeFromCalc = null
  public var includeInFactor : Boolean as IncludeInFactor = null

  @Override
  function toString() : String  {
  return "ERClaimsCalcExclusionRow{" +
      "levyApplicationYear='" + levyApplicationYear + '\'' +
      ", claimsType='" + claimsType + '\'' +
      ", excludeFromCalc='" + excludeFromCalc + '\'' +
      ", includeInFactor='" + includeInFactor + '\'' +
      '}';
  }
}