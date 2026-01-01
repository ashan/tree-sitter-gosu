package edge.servlet.jsonrpc.marshalling.serialization

uses com.fasterxml.jackson.core.JsonGenerator

/** Returns a DTO serializer which do not perform any subtype (polymorphic) dispatch. */
internal final class StrictDtoSerializer implements Serializer {
  /** List of property serializers. */
  private var props : PropertyWriter[]
  construct(ps: PropertyWriter[]) {
    this.props = ps
  }

  override function writeValue(writer: JsonGenerator, object: Object) {
    writer.writeStartObject()
    for (var pw in props) {
      pw.write(writer, object)
    }
    writer.writeEndObject()
  }
}
