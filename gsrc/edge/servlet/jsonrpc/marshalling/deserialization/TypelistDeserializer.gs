package edge.servlet.jsonrpc.marshalling.deserialization


uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.util.Map
uses gw.entity.ITypeList
uses edge.util.MapUtil
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.JsonValue
uses java.io.IOException

/**
 * Deserializer for the typelists.
 */
internal final class TypelistDeserializer implements Deserializer {
  private static final var LOGGER = StructuredLogger.EDGE_SP.withClass(TypelistDeserializer)

  /** Map from the typecode to the typekey object. */
  private var typecodeMap : Map<String, Object>

  /** Type to deserialize. */
  private var type : ITypeList

  private construct(tm : Map<String, Object>, t : ITypeList) {
    this.typecodeMap = tm
    this.type = t
  }

  /**
   * Creates a deserializer for the given typelist.
   */
  internal static function make(t: ITypeList): Deserializer {
    final var codeMap = MapUtil.groupUniqueBy(t.getTypeKeys(false), \k -> k.Code)
    return new TypelistDeserializer(codeMap, t)
  }

  override function deserialize(v: JsonValue): Object {
    if (v.isNull()) {
      return null
    }

    final var code = v.asString()
    final var byCode = typecodeMap.get(code)
    if (byCode != null) {
      return byCode
    }

    final var byTypelist = type.getTypeKey(code)
    if (byTypelist == null) {
      throw new IOException("Could not deserialize typecode " + code + " for typelist " + type);
    }

    LOGGER.warn_ACC("Using non-canonical typecode " + code + " for the typelist " + type)
    return byTypelist
  }
}
