package edge.servlet.jsonrpc.marshalling.serialization

uses com.fasterxml.jackson.core.JsonGenerator

/** Common interface for conversion from values to its transport representation. */
interface Serializer {
  /** Writes a value into the output writer. This write is always performed in the "value" position:
   * It could be a value in the array or value of the property on the json object. By the convention object passed to
   * the serializer is always non-null.
   *
   * @param writer writer to put value to. The serializer <em>must</em> output exactly one Json value into the
   *   <code>writer</code>.
   * @param object object to write. This is supposed to be an object of the type supported by the serializer.
   *   Technically it could be a generic parameter on the serializer. However, in many cases (like DTOs) generic
   *   information is lost anyway so no additional benefits are provided. For now general object is used as an argument.
   */
  function writeValue(writer : JsonGenerator, object : Object)
}
