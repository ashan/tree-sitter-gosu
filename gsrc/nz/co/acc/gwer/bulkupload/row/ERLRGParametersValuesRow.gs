package nz.co.acc.gwer.bulkupload.row

uses java.math.BigDecimal

/**
 * Created by HamblyAl on 18/03/2019.
 */
class ERLRGParametersValuesRow extends AbstractXLSRow {
  public var levyYear : Integer as LevyYear = null
  public var experienceYear : Integer as ExperienceYear = null
  public var levyRiskGroupCode : Integer as LevyRiskGroupCode = null
  public var levyRiskGroupDescription : String as LevyRiskGroupDescription = null
  public var expRehabMgtRateMedEmp : BigDecimal as ExpRehabMgtRateMedEmp = null
  public var expRiskMgtRateMedEmp : BigDecimal as ExpRiskMgtRateMedEmp = null
  public var expRehabMgtRateLgeEmp : BigDecimal as ExpRehabMgtRateLgeEmp = null
  public var expRiskMgtRateLgeEmp : BigDecimal as ExpRiskMgtRateLgeEmp = null
  public var industrySizeModMedEmp : BigDecimal as IndustrySizeModMedEmp = null
  public var industrySizeModLgeEmp : BigDecimal as IndustrySizeModLgeEmp = null
  public var lrgRehabMgtRate : BigDecimal as LrgRehabMgtRate = null

  @Override
  function toString() : String  {
  return "ERLRGParametersValuesRow{" +
      "levyYear='" + levyYear + '\'' +
      ", experienceYear='" + experienceYear + '\'' +
      ", levyRiskGroupCode='" + levyRiskGroupCode + '\'' +
      ", levyRiskGroupDescription'" + levyRiskGroupDescription + '\'' +
      ", expRehabMgtRateMedEmp='" + expRehabMgtRateMedEmp + '\'' +
      ", expRiskMgtRateMedEmp='" + expRiskMgtRateMedEmp + '\'' +
      ", expRehabMgtRateLgeEmp'" + expRehabMgtRateLgeEmp + '\'' +
      ", industrySizeModMedEmp='" + industrySizeModMedEmp + '\'' +
      ", industrySizeModLgeEmp='" + industrySizeModLgeEmp + '\'' +
      ", lrgRehabMgtRate='" + lrgRehabMgtRate + '\'' +
      '}';
  }
}