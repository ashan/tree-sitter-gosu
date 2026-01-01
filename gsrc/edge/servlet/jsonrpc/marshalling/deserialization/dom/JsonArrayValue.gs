package edge.servlet.jsonrpc.marshalling.deserialization.dom

uses java.util.Iterator
uses java.util.Collections

/**
 * Dom representation of the array.
 */
public final class JsonArrayValue extends JsonValue {
  private var _elements : List<JsonValue>

  internal construct(e : List<JsonValue>) {
    super("array")
    this._elements = e
  }

  override public function asArray() : JsonArrayValue {
    return this
  }

  public function asListOfJsonValues() : List<JsonValue> {
    return Collections.unmodifiableList(_elements)
  }

  /** Length of the array. */
  public function getLength() : int {
    return _elements.size()
  }

  public function iterator(): Iterator<JsonValue> {
    return _elements.iterator()
  }

  override function asNativeValue(): Object {
    return _elements.map( \ elt -> elt.asNativeValue())
  }
}
