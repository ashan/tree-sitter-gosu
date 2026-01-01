package edge.servlet.jsonrpc.marshalling.serialization

uses com.fasterxml.jackson.core.JsonGenerator

/** Serializer which proxies requests to other serializers. Useful for avoiding cyclic initialization dependencies. */
internal final class ProxySerializer implements Serializer {
  /** Serialization target. */
  internal var peer: Serializer

  override function writeValue(writer: JsonGenerator, object: Object) {
    peer.writeValue(writer, object)
  }
}
