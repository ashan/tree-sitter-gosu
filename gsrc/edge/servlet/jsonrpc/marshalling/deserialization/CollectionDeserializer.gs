package edge.servlet.jsonrpc.marshalling.deserialization

uses gw.lang.reflect.IConstructorHandler
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.JsonValue
uses java.util.Collection

/**
 * Deserializer for the collections.
 */
internal final class CollectionDeserializer implements Deserializer {

  /** Deserializer for the elements. */
  private var peer : Deserializer

  /** Collection constructor. */
  private var ctor : IConstructorHandler
  construct(p: Deserializer, c: IConstructorHandler) {
    this.peer = p
    this.ctor = c
  }

  override function deserialize(v: JsonValue): Object {
    if (v.isNull()) {
      return null
    }

    final var coll = ctor.newInstance({}) as Collection
    final var itr = v.asArray().iterator()
    while (itr.hasNext()) {
      coll.add(peer.deserialize(itr.next()))
    }
    return coll
  }
}
