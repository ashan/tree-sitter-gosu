package edge.servlet.jsonrpc.marshalling.serialization

uses com.fasterxml.jackson.core.JsonGenerator
/**
 * Serializer which does write null and delegates everything to another one.
 */
internal final class NullSafeSerializer implements Serializer {
  private var peer : Serializer
  construct(p: Serializer) {
    this.peer = p
  }

  override function writeValue(writer: JsonGenerator, object: Object) {
    if (object == null) {
      writer.writeNull()
    } else {
      peer.writeValue(writer, object)
    }
  }
}
