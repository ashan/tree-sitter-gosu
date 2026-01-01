package edge.servlet.jsonrpc.marshalling.deserialization

uses gw.lang.reflect.IType
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.JsonValue

/**
 * Deserializer for the arrays.
 */
internal class ArrayDeserializer implements Deserializer {
  private var peer : Deserializer
  private var eltType : IType
  construct(p: Deserializer, et: IType) {
    this.peer = p
    this.eltType = et
  }

  override function deserialize(v: JsonValue): Object {
    if (v.isNull()) {
      return null
    }

    final var arr = v.asArray()
    final var res = eltType.makeArrayInstance(arr.getLength())
    var ptr = 0
    var itr = arr.iterator()
    while (itr.hasNext()) {
      eltType.setArrayComponent(res, ptr, peer.deserialize(itr.next()))
      ptr += 1
    }
    return res
  }
}
