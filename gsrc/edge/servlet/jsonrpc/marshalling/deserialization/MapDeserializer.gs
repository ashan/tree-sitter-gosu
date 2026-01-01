package edge.servlet.jsonrpc.marshalling.deserialization

uses gw.lang.reflect.IConstructorHandler
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.JsonValue
uses java.util.Map

/**
 * Deserializer for the maps.
 */
internal final class MapDeserializer implements Deserializer {
  /**
   * Element deserializer.
   */
  private var peer : Deserializer
  /**
   * Constructor for the map.
   */
  private var ctor : IConstructorHandler
  construct(p: Deserializer, c: IConstructorHandler) {
    this.peer = p
    this.ctor = c
  }

  override function deserialize(v: JsonValue): Object {
    if (v.isNull()) {
      return null
    }

    final var res = ctor.newInstance({}) as Map
    final var itr = v.asObject().entries()
    while (itr.hasNext()) {
      final var entry = itr.next()
      res.put(entry.Key, peer.deserialize(entry.Value))
    }

    return res
  }
}
