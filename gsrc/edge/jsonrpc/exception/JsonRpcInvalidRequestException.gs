package edge.jsonrpc.exception

uses java.lang.Throwable

final class JsonRpcInvalidRequestException extends JsonRpcException{

  construct(){
    super(JsonRpcErrorCode.INVALID_REQUEST)
  }
  
  construct(myCause: Throwable){
    super(JsonRpcErrorCode.INVALID_REQUEST, myCause)
  }

}
