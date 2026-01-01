package nz.co.acc.gwer.bulkupload.row

/**
 * Created by HamblyAl on 18/03/2019.
 */
class ERCalcTypeLevyYearRow extends AbstractXLSRow {
  public var levyApplicationYear : Integer as LevyApplicationYear = null
  public var programme : ERProgramme_ACC as Programme = null
  public var calcType : ERCalculationType_ACC as CalcType = null

  @Override
  function toString() : String  {
  return "ERCalcTypeLevyYearRow{" +
      "levyApplicationYear='" + levyApplicationYear + '\'' +
      ", programme='" + programme.Code + '\'' +
      ", calcType='" + calcType.Code + '\'' +
      '}';
  }
}