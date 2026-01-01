package edge.servlet.jsonrpc.marshalling.deserialization.dom
/**
 * Representation of the json null.
 */
final class JsonNullValue extends JsonValue {

  internal static final var NULL : JsonNullValue = new JsonNullValue()

  private construct() {
    super("null")
  }

  override function isNull(): boolean {
    return true
  }

  override function asNativeValue(): Object {
    return null
  }
}
