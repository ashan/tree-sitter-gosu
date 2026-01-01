package nz.co.acc.common.function.impl

uses gw.api.util.ConfigAccess
uses gw.xml.XmlElement

uses java.io.FileInputStream
uses java.util.function.Supplier

class GetDatabaseConfig implements Supplier<String> {

  private var _resource : String

  public construct(env : String) {
    using (var fis = new FileInputStream(ConfigAccess.getConfigFile("/config/database-config.xml"))) {
      var xml = XmlElement.parse(fis)

      var config = xml.$Children.firstWhere(\child -> child.getAttributeSimpleValue("env").StringValue == env)

      _resource = getAttribute(config, "datasource-name")
      if (_resource == null) {
        _resource = getAttribute(config, "jdbc-url")
      }
    }
  }

  private function getAttribute(xmlElement : XmlElement, attributeName : String) : String {
    return xmlElement
        ?.$Children
        ?.firstWhere(\child -> child.$AttributeNames.hasMatch(\a -> a.toString() == attributeName))
        ?.getAttributeSimpleValue(attributeName)?.StringValue
  }

  override function get() : String {
    return _resource
  }

}