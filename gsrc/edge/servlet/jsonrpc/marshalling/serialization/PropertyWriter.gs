package edge.servlet.jsonrpc.marshalling.serialization

uses gw.lang.reflect.IPropertyAccessor
uses gw.lang.reflect.IPropertyInfo
uses com.fasterxml.jackson.core.JsonGenerator
uses edge.servlet.jsonrpc.marshalling.Formats

/** Writer for the properties. */
internal final class PropertyWriter {

  /** Property name. */
  private var name : String

  /** Accessor to the property value. */
  private var accessor : IPropertyAccessor

  /** Serializer for the property value. */
  private var serializer : Serializer

  private construct(n : String, a : IPropertyAccessor, s : Serializer) {
    this.name = n
    this.accessor = a
    this.serializer = s
  }

  /** Writes a property value (if it is set). Must be called in the object context. */
  internal function write(writer : JsonGenerator, obj : Object) {
    final var value = accessor.getValue(obj)
    if (value == null) {
      return
    }

    writer.writeFieldName(name)
    serializer.writeValue(writer, value)
  }

  internal static function make(prop : IPropertyInfo, ser : Serializer) : PropertyWriter {
    return new PropertyWriter(Formats.toJsonPropertyName(prop.Name), prop.Accessor, ser)
  }
}
