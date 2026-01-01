package edge.samlV2.idp

class SAMLSession {
  
  public var _sessionIndex:String as readonly SessionIndex = null
  public var _username:String as readonly UserName = null
  public var _expiry:org.joda.time.DateTime as readonly Expiry = org.joda.time.DateTime.now()

  public property get Expired():Boolean {
    return Expiry?.BeforeNow
  }

  construct(user:String, sess:String, exp:org.joda.time.DateTime) {
    _username = user
    _sessionIndex = sess
    _expiry = exp
  }
}
