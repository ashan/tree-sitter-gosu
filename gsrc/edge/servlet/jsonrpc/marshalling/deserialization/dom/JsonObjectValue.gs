package edge.servlet.jsonrpc.marshalling.deserialization.dom

uses java.util.Map
uses java.util.Iterator

/**
 * Object-like representation of the json value.
 */
final class JsonObjectValue extends JsonValue {
  private var _fields : Map<String, JsonValue>

  internal construct(f : Map<String, JsonValue>) {
    super("object")
    this._fields = f
  }


  override public function asObject() : JsonObjectValue {
    return this
  }

  /** Returns a value for the given key. Returns JsonNull for values not in the map. */
  public function get(key : String) : JsonValue {
    final var res = _fields.get(key)
    return res != null ? res : JsonNullValue.NULL
  }


  /** Entries in this object. */
  public function entries(): Iterator<Map.Entry<String, JsonValue>> {
    return _fields.entrySet().iterator()
  }

  override function asNativeValue(): Object {
    return _fields.mapValues( \ value -> value.asNativeValue())
  }
}
