package nz.co.acc.gwer.bulkupload.row

/**
 * Created by HamblyAl on 18/03/2019.
 */
class ERParameterCodeRow extends AbstractXLSRow {
  public var code : String as Code = null
  public var name : String as Name = null
  public var description : String as Description = null

  @Override
  function toString() : String  {
  return "ERParameterCode{" +
      "code='" + code + '\'' +
      ", name='" + name + '\'' +
      ", description='" + description +
      '}';
  }
}