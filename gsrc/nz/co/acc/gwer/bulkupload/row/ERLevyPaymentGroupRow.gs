package nz.co.acc.gwer.bulkupload.row

/**
 * Created by HamblyAl on 18/03/2019.
 */
class ERLevyPaymentGroupRow extends AbstractXLSRow {
  public var levyApplicationYear : Integer as LevyApplicationYear = null
  public var levyPaymentGroup : String as LevyPaymentGroup = null
  public var riskMgmtInd : Boolean as RiskMgmtInd = null
  public var rehabMgmtInd : Boolean as RehabMgmtInd = null

  @Override
  function toString() : String  {
  return "ERLevyPaymentGroupRow{" +
      "levyApplicationYear='" + levyApplicationYear + '\'' +
      ", levyPaymentGroup='" + levyPaymentGroup + '\'' +
      ", riskMgmtInd='" + riskMgmtInd + '\'' +
      ", rehabMgmtInd='" + rehabMgmtInd + '\'' +
      '}';
  }
}