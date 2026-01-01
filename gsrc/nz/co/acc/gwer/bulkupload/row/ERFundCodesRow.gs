package nz.co.acc.gwer.bulkupload.row

/**
 * Created by HamblyAl on 18/03/2019.
 */
class ERFundCodesRow extends AbstractXLSRow {
  public var levyApplicationYear : Integer as LevyApplicationYear = null
  public var fundCode : String as FundCode = null
  public var fundName : String as FundName = null
  public var experienceRatingInd: Boolean as InjuryDescription = null

  @Override
  function toString() : String  {
  return "ERFundCodesRow{" +
      "levyApplicationYear='" + levyApplicationYear + '\'' +
      ", fundCode='" + fundCode + '\'' +
      ", fundName='" + fundName + '\'' +
      ", experienceRatingInd='" + experienceRatingInd + '\'' +
      '}';
  }
}