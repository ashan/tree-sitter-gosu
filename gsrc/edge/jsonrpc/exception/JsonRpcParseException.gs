package edge.jsonrpc.exception

uses java.lang.Throwable

final class JsonRpcParseException extends JsonRpcException{

  construct(){
    super(JsonRpcErrorCode.PARSE_ERROR)
  }
  
  construct(myCause: Throwable){
    super(JsonRpcErrorCode.PARSE_ERROR, myCause)
  }
}
