package edge.servlet.jsonrpc.marshalling.deserialization.dom
/**
 * Boolean value in the Json.
 */
final class JsonBooleanValue extends JsonValue {

  internal static final var TRUE : JsonBooleanValue = new JsonBooleanValue(true)
  internal static final var FALSE : JsonBooleanValue = new JsonBooleanValue(false)

  private var _v : boolean

  private construct(v : boolean) {
    super("boolean")
    this._v = v
  }

  override function asBoolean(): boolean {
    return _v
  }

  override function asNativeValue(): Object {
    return _v
  }
}
