package edge.servlet.jsonrpc.marshalling.deserialization

uses java.util.Map
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.JsonValue
uses java.io.IOException

/**
 * Deserializer which converts value by resolving it from the map.
 */
internal final class UnmapValueDeserializer implements Deserializer {
  /** Map from code to a resulting object. */
  private var _map : Map<String, Object>
  /** Entity name to use in the error messages. */
  private var _entityName: String

  construct(m : Map<String, Object>, e : String) {
    this._map = m
    this._entityName = e
  }

  override function deserialize(v: JsonValue): Object {
    if (v.isNull()) {
      return null
    }

    final var res = _map.get(v.asString())
    if (res == null) {
      throw new IOException("Bad key " + v.asString() + " for " + _entityName)
    }
    return res
  }
}
