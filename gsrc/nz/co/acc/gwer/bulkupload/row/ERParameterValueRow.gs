package nz.co.acc.gwer.bulkupload.row

/**
 * Created by HamblyAl on 18/03/2019.
 */
class ERParameterValueRow extends AbstractXLSRow {
  public var levyYear : Integer as LevyYear = null
  public var code : String as Code = null
  public var value : String as Value = null

  @Override
  function toString() : String  {
  return "ERParameterValue{" +
      "levyYear='" + levyYear + '\'' +
      ", code='" + code + '\'' +
      ", value='" + value +
      '}';
  }
}