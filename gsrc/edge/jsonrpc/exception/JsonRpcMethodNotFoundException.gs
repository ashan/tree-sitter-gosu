package edge.jsonrpc.exception

uses java.lang.Throwable

final class JsonRpcMethodNotFoundException extends JsonRpcException {

  construct(){
    super(JsonRpcErrorCode.METHOD_NOT_FOUND)
  }
  
  construct(myCause: Throwable){
    super(JsonRpcErrorCode.METHOD_NOT_FOUND, myCause)
  }

}
