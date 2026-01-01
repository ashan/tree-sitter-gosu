package edge.capabilities.quote.quoting.exception

uses edge.exception.ApplicationErrorCode
uses edge.exception.ApplicationException
uses java.lang.Throwable

class EntityValidationException extends ApplicationException {

  construct(){
    super(ApplicationErrorCode.GW_ENTITY_VALIDATION_ERROR)
  }
   
  construct(myCause: Throwable){
    super(ApplicationErrorCode.GW_ENTITY_VALIDATION_ERROR, myCause)
  }


}
