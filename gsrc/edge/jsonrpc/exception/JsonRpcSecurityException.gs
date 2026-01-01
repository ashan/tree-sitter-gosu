package edge.jsonrpc.exception

uses edge.exception.ApplicationErrorCode
uses java.lang.Throwable
uses edge.exception.ApplicationException

final class JsonRpcSecurityException extends JsonRpcApplicationException{

  construct(){
    super()
    Data = new JsonRpcExceptionData(ApplicationErrorCode.GW_SECURITY_ERROR)
  }
  
  construct(myCause: Throwable){
    super(myCause)
    Data = new JsonRpcExceptionData(ApplicationErrorCode.GW_SECURITY_ERROR)   
  }
  
  construct(appExp: ApplicationException){
    super(appExp)
    appExp.Data = ApplicationErrorCode.GW_SECURITY_ERROR
  }

}
