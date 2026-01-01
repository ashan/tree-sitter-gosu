package nz.co.acc.gwer.bulkupload.row

/**
 * Created by HamblyAl on 18/03/2019.
 */
class ERStepAdjustmentRow extends AbstractXLSRow {
  public var levyApplicationYear : Integer as LevyApplicationYear = null
  public var year1Adjustment : Integer as Year1Adjustment = null
  public var year2Adjustment : Integer as Year2Adjustment = null
  public var year3Adjustment : Integer as Year3Adjustment = null

  @Override
  function toString() : String  {
  return "ERStepAdjustmentRow{" +
      "levyApplicationYear='" + levyApplicationYear + '\'' +
      ", year1Adjustment='" + year1Adjustment + '\'' +
      ", year2Adjustment='" + year2Adjustment + '\'' +
      ", year3Adjustment='" + year3Adjustment + '\'' +
      '}';
  }
}