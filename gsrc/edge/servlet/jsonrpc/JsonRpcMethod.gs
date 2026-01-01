package edge.servlet.jsonrpc

uses edge.jsonrpc.endpoint.IEndpointMethod
uses edge.security.EffectiveUser
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.JsonValue
uses edge.servlet.jsonrpc.marshalling.deserialization.Deserializer
uses edge.servlet.jsonrpc.marshalling.deserialization.DeserializerFactory
uses edge.jsonrpc.exception.JsonRpcInvalidParamsException

/**
 * Handler for the json-RPC method.
 */
internal final class JsonRpcMethod {

  /**
   * Peer for this method.
   */
  private var peer : IEndpointMethod

  /**
   * Parsers for the arguments.
   */
  private var argParsers : List<Deserializer>

  construct(p : IEndpointMethod) {
    this.peer = p
    this.argParsers = p.getArgumentTypes().map(\elt -> DeserializerFactory.INSTANCE.getDeserializer(elt))
  }


  /**
   * Handles a method call.
   */
  internal function call(user : EffectiveUser, params : List<JsonValue>) : Object {
    if (params.size() != argParsers.size()) {
      throw new JsonRpcInvalidParamsException() {
        :Message = "Invalid number of arguments, expected " + argParsers.size() + " but got " + params.size()
      }
    }

    final var typedArgs = params.mapWithIndex(\item, idx -> argParsers.get(idx).deserialize(item))
    return peer.call(user, typedArgs)
  }
}
