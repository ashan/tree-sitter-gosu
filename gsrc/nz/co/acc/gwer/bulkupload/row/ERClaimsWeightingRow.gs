package nz.co.acc.gwer.bulkupload.row

uses java.math.BigDecimal

/**
 * Created by HamblyAl on 18/03/2019.
 */
class ERClaimsWeightingRow extends AbstractXLSRow {
  public var levyApplicationYear : Integer as LevyApplicationYear = null
  public var experienceYear : Integer as ExperienceYear = null
  public var weighting : BigDecimal as Weighting = null

  @Override
  function toString() : String  {
  return "ERClaimsWeightingRow{" +
      "levyApplicationYear='" + levyApplicationYear + '\'' +
      ", experienceYear='" + experienceYear + '\'' +
      ", weighting='" + weighting + '\'' +
      '}';
  }
}