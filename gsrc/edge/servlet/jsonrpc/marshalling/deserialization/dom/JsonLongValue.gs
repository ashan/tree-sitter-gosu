package edge.servlet.jsonrpc.marshalling.deserialization.dom

uses java.math.BigInteger
uses java.math.BigDecimal

/**
 * Float value in the source.
 */
final class JsonLongValue extends JsonValue {
  private var _v : long;

  internal construct(v : long) {
    super("long")
    this._v = v
  }

  override public function asLong() : long {
    return _v
  }

  override public function asBigInteger() : BigInteger {
    return BigInteger.valueOf(_v)
  }

  override public function asBigDecimal() : BigDecimal {
    return BigInteger.valueOf(_v)
  }

  override public function asFloat() : float {
    return _v
  }

  override public function asDouble(): double {
    return _v
  }

  override function asNativeValue(): Object {
    return _v
  }
}
