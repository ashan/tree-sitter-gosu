package edge.exception

uses java.lang.Exception
uses java.lang.Throwable

abstract class ApplicationException extends Exception {
  private var _msg: String
  private var _data: Object
  
  private var _code: ApplicationErrorCode as readonly Code
  
  override public property get Message(): String{
    if(_msg != null){
      return _msg  
    }else{
      return super.Message
    }
  }
  
  public property set Message(myMsg: String){
    _msg = myMsg
  }
  
  public property get Data(): Object{
    return _data
  }
  
  public property set Data(myData: Object){
    _data = myData
  }
  
  protected construct(myCode: ApplicationErrorCode){
    this._code = myCode
  }
  
  protected construct(myCode: ApplicationErrorCode, myCause: Throwable){
    super(myCause)
    this._code = myCode
  }
}
