package edge.servlet.jsonrpc.marshalling.deserialization.dom

uses java.math.BigInteger

/**
 * Big integer value in the source.
 */
final class JsonBigIntegerValue extends JsonValue {
  private var _v : BigInteger;

  internal construct(v : BigInteger) {
    super("BigInteger")
    this._v = v
  }

  override public function asBigInteger() : BigInteger {
    return _v
  }

  override public function asFloat() : float {
    return _v.floatValue()
  }

  override public function asDouble(): double {
    return _v.doubleValue()
  }

  override function asNativeValue(): Object {
    return _v
  }
}
