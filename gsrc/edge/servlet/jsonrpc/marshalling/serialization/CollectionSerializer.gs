package edge.servlet.jsonrpc.marshalling.serialization

uses com.fasterxml.jackson.core.JsonGenerator

/** Serializer for the collection elements. */
internal final class CollectionSerializer implements Serializer {

  /** Serializer for the element values. */
  private var elementSerializer : Serializer

  construct(es : Serializer) {
    this.elementSerializer = es
  }

  override function writeValue(writer: JsonGenerator, object: Object) {
    writer.writeStartArray()
    final var itr = (object as java.util.Collection).iterator()
    while (itr.hasNext()) {
      elementSerializer.writeValue(writer, itr.next())
    }
    writer.writeEndArray()
  }
}
