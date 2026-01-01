package edge.capabilities.quote.quoting.exception

uses edge.exception.ApplicationException
uses edge.exception.ApplicationErrorCode
uses java.lang.Throwable

class UnderwritingException extends ApplicationException {
  
  private var _showExceptionData:boolean as ShowExceptionData = false

  construct(){
    super(ApplicationErrorCode.GW_UNDERWRITING_ERROR)
  }

  construct(myCode: ApplicationErrorCode){
    super(myCode)
  }
   
  construct(myCause: Throwable){
    super(ApplicationErrorCode.GW_UNDERWRITING_ERROR, myCause)
  }

  construct(myCode: ApplicationErrorCode, myCause: Throwable){
    super(myCode, myCause)
  }
  
  override property get Data(): Object {
    return ShowExceptionData ? super.Data : null
  }
}
