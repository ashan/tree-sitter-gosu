package edge.servlet.jsonrpc.marshalling.deserialization.dom

uses java.math.BigDecimal
/**
 * Big  decimal representation of the value.
 */
final class JsonBigDecimalValue extends JsonValue {
  private var _v : BigDecimal

  construct(v  :BigDecimal) {
    super("BigDecimal")
    this._v = v
  }


  override public function asFloat() : float {
    return _v.floatValue()
  }

  override public function asDouble() : double {
    return _v.doubleValue()
  }

  override public function asBigDecimal(): BigDecimal {
    return _v.doubleValue()
  }

  override function asNativeValue(): Object {
    return _v
  }
}
