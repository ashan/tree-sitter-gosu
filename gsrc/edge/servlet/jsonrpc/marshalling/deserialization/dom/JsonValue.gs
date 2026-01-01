package edge.servlet.jsonrpc.marshalling.deserialization.dom

uses java.io.IOException
uses java.math.BigInteger
uses java.math.BigDecimal

/**
 * "Dom-like" representation of the JSON.
 */
abstract class JsonValue {

  private var _kind : String

  internal construct(k : String){
    this._kind = k
  }

  /** Tells if this json value is null. */
  public function isNull() : boolean {
    return false
  }

  public function asBoolean() : boolean {
    throw new IOException("Could not convert " + _kind + " into boolean")
  }

  public function asInt() : int {
    throw new IOException("Could not convert " + _kind + " into integer")
  }

  public function asLong() : long {
    throw new IOException("Could not convert " + _kind + " into long")
  }

  public function asBigInteger() : BigInteger {
    throw new IOException("Could not convert " + _kind + " into BigInteger")
  }

  public function asFloat() : float {
    throw new IOException("Could not convert " + _kind + " into float")
  }

  public function asDouble() : double {
    throw new IOException("Could not convert " + _kind + " into double")
  }

  public function asBigDecimal() : BigDecimal {
    throw new IOException("Could not convert " + _kind + " into big Decimal")
  }

  public function asString() : String {
    throw new IOException("Could not convert " + _kind + " into String")
  }

  public function asObject() : JsonObjectValue {
    throw new IOException("Could not convert " + _kind + " into json object")
  }

  public function asArray() : JsonArrayValue {
    throw new IOException("Could not convert " + _kind + " into json Array")
  }

  /** Returns a "native" implementation of this object. */
  public abstract function asNativeValue() : Object
}
