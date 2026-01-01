package nz.co.acc.integration.ir.inbound.transformer.payload

uses gw.util.GosuStringUtil

abstract class AbstractPayloadBuilder {
  final static var NEWLINE = "\n"
  var _sb = new StringBuilder()

  protected function appendIfNotBlank(propertyName : String, value : String) {
    if (not GosuStringUtil.isBlank(value)) {
      _sb.append(propertyName).append("=").append(value).append(NEWLINE)
    }
  }

  public property get PropertiesString() : String {
    return _sb.toString()
  }
}