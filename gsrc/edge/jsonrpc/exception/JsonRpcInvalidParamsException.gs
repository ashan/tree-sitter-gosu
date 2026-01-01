package edge.jsonrpc.exception

uses java.lang.Throwable

final class JsonRpcInvalidParamsException extends JsonRpcException{

  construct(){
    super(JsonRpcErrorCode.INVALID_PARAMS)
  }
  
  construct(myCause: Throwable){
    super(JsonRpcErrorCode.INVALID_PARAMS, myCause)
  }
}
