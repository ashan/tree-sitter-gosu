package edge.servlet.jsonrpc.marshalling.serialization

uses gw.lang.reflect.IType
uses com.fasterxml.jackson.core.JsonGenerator

/** Dispatches the serialization based on the actual object type. */
internal final class DispatchDtoSerializer implements Serializer {

  /** Factory used to look up serializers in the runtime. */
  private var runtimeTypeSerializers: SerializerProvider

  /** Type of the DTO itself. Used to speed-up lookups. */
  private var selfType : IType

  /** Serializer for the self type. */
  private var selfSerializer : Serializer

  construct(f: SerializerProvider, st: IType) {
    this.runtimeTypeSerializers = f
    this.selfType = st
    /* Safe get as all serializers are created in the safe context. */
    this.selfSerializer = st.Abstract ? null : f.safeGet(st)
  }

  override function writeValue(writer: JsonGenerator, object: Object) {
    final var rt = typeof(object)
    /* Non-safe get. Write value could be called from multiple threads. */
    final var realSerializer = rt == selfType ? selfSerializer : runtimeTypeSerializers.get(rt)
    realSerializer.writeValue(writer, object)
  }
}
