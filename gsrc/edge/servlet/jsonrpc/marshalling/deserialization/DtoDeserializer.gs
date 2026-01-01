package edge.servlet.jsonrpc.marshalling.deserialization

uses gw.lang.reflect.IConstructorHandler
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.JsonValue

/**
 * Deserializer for the DTOs.
 */
internal final class DtoDeserializer implements Deserializer {
  /** DTO constructor. */
  private var ctor : IConstructorHandler

  /** DTO property deserializer. */
  private var props : PropertyReader[]
  construct(c: IConstructorHandler, p: PropertyReader[]) {
    this.ctor = c
    this.props = p
  }

  override function deserialize(v: JsonValue): Object {
    if (v.isNull()) {
      return null
    }

    final var jsonObj = v.asObject()
    final var res = ctor.newInstance({})

    for (var prop in props) {
      prop.copyValue(res, jsonObj)
    }

    return res
  }
}
