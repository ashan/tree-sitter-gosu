package edge.servlet.jsonrpc.protocol

uses java.util.ArrayList
uses edge.jsonmapper.JsonProperty
uses java.lang.IllegalArgumentException
uses java.lang.Integer
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.JsonValue
uses java.util.Collections

/**
 * Represents a JSON-RPC 2.0 request.
 */
final class JsonRpcRequest {

  @JsonProperty
  private var _method : String as readonly Method
  
  @JsonProperty
  private var _params : List<JsonValue> as readonly Params
  
  @JsonProperty
  private var _id : Object as readonly Id

  
  /**
   * Construct a new JsonRpc request with no parameters
   * 
   * @param myMethod The name of the requested method. Must not be null
   * @param myParams The request parameters. Null if none
   * @param myId The request identifier echoed back to the caller
   */
  construct(final myMethod : String, final myParams : List<JsonValue>, final myId : Object){
    setMethod(myMethod)
    setParams(myParams)
    setID(myId)
  }


  /**
   * Sets the name of the requested method
   * 
   * @param method The method name. Must be non null
   */
  private function setMethod(final myMethod : String){
    if(myMethod == null){
      throw new IllegalArgumentException("The method name must not be null")
    }
    _method = myMethod
  }
  
  /**
   * Set the request identifier
   * 
   * @param myId The request identifier echoed back to the caller
   */
  private function setID(final myId : Object){
    if(myId != null && !(myId typeis Boolean) && !(myId typeis Integer) && !(myId typeis String)){
      throw new IllegalArgumentException("The request identifier must map to JSON scalar")
    }
    _id = myId
  }
  
  /**
   * Sets the request parameters 
   * 
   * @param myParams The request parameters
   */
  private function setParams(final myParams : List<JsonValue>){
    _params = myParams == null ?  Collections.emptyList() : myParams
  }
}
