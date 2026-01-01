package edge.security.authorization.exception

uses edge.exception.ApplicationException
uses edge.exception.ApplicationErrorCode
uses edge.security.EffectiveUser
uses java.lang.Throwable
uses java.lang.StringBuilder
uses edge.PlatformSupport.PortalStringUtils

class AuthorizationException extends ApplicationException {
  
  private var _showExceptionData:boolean as ShowExceptionData = false
  
  construct(){
    super(ApplicationErrorCode.GW_SECURITY_ERROR)
  }
  
  construct(myCause: Throwable){
    super(ApplicationErrorCode.GW_SECURITY_ERROR, myCause)
  }
  
  override property get Data(): Object {
    return ShowExceptionData ? super.Data: null
  }
  
  public static function buildStringMessage(e : AuthorizationException, portalUser: EffectiveUser) : String{
    var sBuilder = new StringBuilder()
    if(PortalStringUtils.notBlank(e.Message)){
      sBuilder.append(e.Message)
    }else{
      sBuilder.append("Failed Authorization")
    }
    if(portalUser != null){
      sBuilder.append(" for user ")
      sBuilder.append(portalUser)
    }else{
      sBuilder.append(" no portal user set ")
    }
    return sBuilder.toString()
  }
}
