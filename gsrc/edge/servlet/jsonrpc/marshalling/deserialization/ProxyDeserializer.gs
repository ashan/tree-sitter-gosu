package edge.servlet.jsonrpc.marshalling.deserialization

uses edge.servlet.jsonrpc.marshalling.deserialization.dom.JsonValue
/**
 * Deserializer proxying to another ove. Used to resolve cyclical dependencies.
 */
internal final class ProxyDeserializer implements Deserializer {
  internal  var peer: Deserializer

  override function deserialize(v: JsonValue): Object {
    return peer.deserialize(v)
  }
}
