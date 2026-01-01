package edge.servlet.jsonrpc.marshalling.deserialization

uses gw.lang.reflect.IType
uses java.util.Map
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.JsonValue
uses java.io.IOException
uses java.util.HashMap
uses edge.servlet.jsonrpc.marshalling.Formats

/**
 * Deserializers for the common (core) types.
 */
internal final class CoreDeserializers {

  private static final class NullSafe implements  Deserializer {
    private var _peer : Deserializer

    construct(peer : Deserializer) {
      this._peer = peer
    }

    override function deserialize(v: JsonValue): Object {
      if (v.isNull()) {
        throw new IOException("Could not read null as a value for the primitive")
      }
      return _peer.deserialize(v)
    }
  }

  private static final class Nullable implements Deserializer {
    private var _peer : Deserializer
    construct(peer: Deserializer) {
      this._peer = peer
    }

    override function deserialize(v: JsonValue): Object {
      if (v.isNull()) {
        return null
      }
      return _peer.deserialize(v)
    }
  }

  /** Platform deserializers. */
  public static final var CORE_DESERIALIZERS : Map<IType, Deserializer> = generateDeserializers()


  /** Factory for the core serializers. */
  private static function generateDeserializers() : Map<IType, Deserializer> {
    final var res = new HashMap<IType, Deserializer>()


    register(res, byte, java.lang.Byte, new Deserializer(){
      override function deserialize(v: JsonValue): Object {
        var vv = v.asInt()
        if (vv < java.lang.Byte.MIN_VALUE || vv > java.lang.Byte.MAX_VALUE) {
          throw new IOException("Byte value overflow : " + vv)
        }
        return null
      }
    })

    register(res, short, java.lang.Short, new Deserializer(){
      override function deserialize(v: JsonValue): Object {
        var vv = v.asInt()
        if (vv < java.lang.Short.MIN_VALUE || vv > java.lang.Short.MAX_VALUE) {
          throw new IOException("Short value overflow : " + vv)
        }
        return null
      }
    })

    register(res, char, java.lang.Character, new Deserializer(){
      override function deserialize(v: JsonValue): Object {
        var s = v.asString()
        if (s.length() != 1) {
          throw new IOException("Incorrect string representation " + s)
        }
        return s.charAt(0)
      }
    })

    register(res, int, java.lang.Integer, new Deserializer(){
      override function deserialize(v: JsonValue): Object {
        return v.asInt()
      }
    })

    register(res, long, java.lang.Long, new Deserializer(){
      override function deserialize(v: JsonValue): Object {
        return v.asLong()
      }
    })

    register(res, float, java.lang.Float, new Deserializer(){
      override function deserialize(v: JsonValue): Object {
        return v.asFloat()
      }
    })

    register(res, double, java.lang.Double, new Deserializer(){
      override function deserialize(v: JsonValue): Object {
        return v.asDouble()
      }
    })

    register(res, boolean, java.lang.Boolean, new Deserializer(){
      override function deserialize(v: JsonValue): Object {
        return v.asBoolean()
      }
    })

    res.put(java.lang.String, new Deserializer() {
      override function deserialize(v: JsonValue): Object {
        return v.isNull() ? null : v.asString()
      }
    })

    res.put(java.math.BigInteger, new Deserializer() {
      override function deserialize(v: JsonValue): Object {
        return v.isNull() ? null : v.asBigInteger()
      }
    })

    res.put(java.math.BigDecimal , new Deserializer() {
      override function deserialize(v: JsonValue): Object {
        return v.isNull() ? null : v.asBigDecimal()
      }
    })

    res.put(java.util.Date, new Deserializer() {
      override function deserialize(v: JsonValue): Object {
        return v.isNull() ? null : Formats.DATE_FORMAT.get().parse(v.asString())
      }
    })

    res.put(java.lang.Object, new Deserializer() {
      override function deserialize(v: JsonValue): Object {
        return v.asNativeValue()
      }
    })


    return res
  }

  /** Registers a serializer for two types. This is used to simplify generation of serializers for primitives and its
   * wrappers.
   */
  private static function register(res : Map<IType, Deserializer>, primitiveType : IType, boxType : IType, ser : Deserializer) {
    res.put(primitiveType, new NullSafe(ser))
    res.put(boxType, new Nullable(ser))
  }

}
