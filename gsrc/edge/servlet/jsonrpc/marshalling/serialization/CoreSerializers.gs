package edge.servlet.jsonrpc.marshalling.serialization

uses gw.lang.reflect.IType
uses java.util.Map
uses java.util.HashMap
uses com.fasterxml.jackson.core.JsonGenerator
uses java.util.Date
uses gw.entity.TypeKey
uses java.lang.Enum
uses edge.servlet.jsonrpc.marshalling.Formats
uses java.math.BigInteger
uses java.math.BigDecimal

/** Serializers for the core types. */
final class CoreSerializers {

  /** Serializers for core (platform) types. */
  public static final var CORE_SERIALIZERS : Map<IType, Serializer> = generateSerializers();


  /** Serializer for dates. Could be used for date descendants as well. */
  public static final var DATE_SERIALIZER : Serializer = new Serializer() {
    override function writeValue(writer: JsonGenerator, object: Object) {
      writer.writeString(Formats.DATE_FORMAT.get().format(object as Date));
    }
  }


  /** Serializer for the typekey values. All typekeys are serialized in the same way. */
  public static final var TYPEKEY_SERIALIZER : Serializer = new Serializer() {
    override function writeValue(writer: JsonGenerator, object: Object) {
      writer.writeString((object as TypeKey).Code)
    }
  }


  /** Writer for the enum values. */
  public static final var ENUM_SERIALIZER : Serializer = new Serializer(){
    override function writeValue(writer: JsonGenerator, object: Object) {
      writer.writeString((object as Enum).name())
    }
  }


  /** Generates the core serializers. */
  private static function generateSerializers() : Map<IType, Serializer> {
    final var res = new HashMap<IType, Serializer>()

    register(res, byte, java.lang.Byte, new Serializer(){
      override function writeValue(writer: JsonGenerator, object: Object) {
        writer.writeNumber((object as java.lang.Byte).intValue())
      }
    })

    register(res, short, java.lang.Short, new Serializer(){
      override function writeValue(writer: JsonGenerator, object: Object) {
        writer.writeNumber((object as java.lang.Short).intValue())
      }
    })

    register(res, char, java.lang.Character, new Serializer(){
      override function writeValue(writer: JsonGenerator, object: Object) {
        writer.writeNumber((object as java.lang.Character).toString())
      }
    })

    register(res, int, java.lang.Integer, new Serializer(){
      override function writeValue(writer: JsonGenerator, object: Object) {
        writer.writeNumber((object as java.lang.Integer).intValue())
      }
    })

    register(res, long, java.lang.Long, new Serializer(){
      override function writeValue(writer: JsonGenerator, object: Object) {
        writer.writeNumber((object as java.lang.Long).longValue())
      }
    })

    register(res, float, java.lang.Float, new Serializer(){
      override function writeValue(writer: JsonGenerator, object: Object) {
        writer.writeNumber((object as java.lang.Float).floatValue())
      }
    })

    register(res, double, java.lang.Double, new Serializer(){
      override function writeValue(writer: JsonGenerator, object: Object) {
        writer.writeNumber((object as java.lang.Double).doubleValue())
      }
    })

    register(res, boolean, java.lang.Boolean, new Serializer(){
      override function writeValue(writer: JsonGenerator, object: Object) {
        writer.writeBoolean((object as java.lang.Boolean).booleanValue())
      }
    })

    res.put(String, new Serializer(){
      override function writeValue(writer: JsonGenerator, object: Object) {
        writer.writeString(object as String);
      }
    })

    res.put(java.math.BigInteger, new Serializer() {
      override function writeValue(writer: JsonGenerator, object: Object) {
        writer.writeNumber(object as BigInteger)
      }
    })

    res.put(java.math.BigDecimal, new Serializer() {
      override function writeValue(writer: JsonGenerator, object: Object) {
        writer.writeNumber(object as BigDecimal)
      }
    })

    return res
  }


  /** Registers a serializer for two types. This is used to simplify generation of serializers for primitives and its
   * wrappers.
   */
  private static function register(res : Map<IType, Serializer>, t1 : IType, t2 : IType, ser : Serializer) {
    res.put(t1, ser)
    res.put(t2, ser)
  }
}
