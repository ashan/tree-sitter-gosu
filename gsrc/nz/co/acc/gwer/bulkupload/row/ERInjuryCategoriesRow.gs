package nz.co.acc.gwer.bulkupload.row

/**
 * Created by HamblyAl on 18/03/2019.
 */
class ERInjuryCategoriesRow extends AbstractXLSRow {
  public var levyApplicationYear : Integer as LevyApplicationYear = null
  public var injuryCategory : String as InjuryCategory = null
  public var experienceRatingInd: Boolean as InjuryDescription = null

  @Override
  function toString() : String  {
  return "ERInjuryCategoriesRow{" +
      "levyApplicationYear='" + levyApplicationYear + '\'' +
      ",injuryCategory='" + injuryCategory + '\'' +
      ", experienceRatingInd='" + experienceRatingInd + '\'' +
      '}';
  }
}