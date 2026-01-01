package nz.co.acc.gwer.bulkupload.row

/**
 * Created by HamblyAl on 18/03/2019.
 */
class ERManualCalcRow extends AbstractXLSRow {
  public var levyApplicationYear : Integer as LevyApplicationYear = null
  public var accPolicyID : String as ACCPolicyID = null
  public var reason : String as Reason = null

  @Override
  function toString() : String  {
  return "ERManualCalcRow{" +
      "levyApplicationYear='" + levyApplicationYear + '\'' +
      ", accPolicyID='" + accPolicyID + '\'' +
      ", reason='" + reason + '\'' +
      '}';
  }
}