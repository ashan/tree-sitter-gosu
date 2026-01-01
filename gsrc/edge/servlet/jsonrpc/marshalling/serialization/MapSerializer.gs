package edge.servlet.jsonrpc.marshalling.serialization

uses com.fasterxml.jackson.core.JsonGenerator

/** Serializer for map values. */
internal final class MapSerializer implements Serializer {
  private var elementSerializer : Serializer
  construct(es: Serializer) {
    this.elementSerializer = es
  }

  override function writeValue(writer: JsonGenerator, object: Object) {
    final var entries = (object as java.util.Map).entrySet().iterator()
    writer.writeStartObject()
    while (entries.hasNext()) {
      final var entry = entries.next()
      writer.writeFieldName(entry.Key.toString())
      elementSerializer.writeValue(writer, entry.Value)
    }
    writer.writeEndObject()
  }
}
