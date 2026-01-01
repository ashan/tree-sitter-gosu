package edge.jsonrpc.exception

uses java.lang.Throwable

final class JsonRpcInternalErrorException extends JsonRpcException{

  construct(){
    super(JsonRpcErrorCode.INTERNAL_ERROR)
  }
  
  construct(myCause: Throwable){
    super(JsonRpcErrorCode.INTERNAL_ERROR, myCause)
  }
}
