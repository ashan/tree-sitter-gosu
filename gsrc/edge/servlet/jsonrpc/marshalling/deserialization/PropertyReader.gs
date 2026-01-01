package edge.servlet.jsonrpc.marshalling.deserialization



uses gw.surepath.suite.integration.logging.StructuredLogger

uses gw.lang.reflect.IPropertyAccessor
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.JsonObjectValue
uses gw.lang.reflect.IPropertyInfo
uses edge.servlet.jsonrpc.marshalling.Formats
uses java.lang.Exception

/**
 * Reader for the property.
 */
internal final class PropertyReader {
  private static final var LOGGER = StructuredLogger.EDGE_SP.withClass(PropertyReader)

  private var propAccessor : IPropertyAccessor
  private var propName : String
  private var altName : String
  private var peer : Deserializer
  private var cn : String

  private construct(pa : IPropertyAccessor, pn : String, an : String, p : Deserializer, c : String) {
    this.propAccessor = pa
    this.propName = pn
    this.altName = an
    this.peer = p
    this.cn = c
  }

  /** Copies value from the json object onto the resulting one. */
  internal function copyValue(obj : Object, source : JsonObjectValue) {
    try {
      var propValue = source.get(propName)
      if (propValue.isNull()) {
        propValue = source.get(altName)
        if (!propValue.isNull()) {
          LOGGER.error_ACC("Wrong casing for the incoming property " + propName + " on " + cn)
        }
      }
      propAccessor.setValue(obj, peer.deserialize(propValue))
    } catch (e : Exception) {
      LOGGER.error_ACC("Could not deserialize property " + propName + " on " + cn, e)
      throw e
    }
  }

  internal static function make(prop : IPropertyInfo, peer : Deserializer) : PropertyReader {
    return new PropertyReader(prop.Accessor, Formats.toJsonPropertyName(prop.Name), prop.Name, peer, prop.OwnersType.QName)
  }
}
