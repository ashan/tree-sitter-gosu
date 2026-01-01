package edge.security.authorization

uses java.lang.IllegalArgumentException
uses edge.jsonmapper.JsonProperty

/**
 * Definition of the authority. Holds authority type and authorized item.
 */
final class Authority {

  /**
   * Authority type for this item.
   */
  @JsonProperty
  private var _authorityType:AuthorityType as AuthorityType
  
  /**
   * Target security item (like policy number or account id).
   */
  @JsonProperty
  private var _target:String as Target

  construct() {

  }
  
  construct(auth :  AuthorityType, tgt : String) {
    if (auth == null) {
      throw new IllegalArgumentException("Authority type must be specified")
    }
    this._authorityType = auth
    this._target = tgt
  }
  
  override function hashCode() : int {
    var result:int = Target != null ? Target.hashCode() : 0
    result = 31 * result + AuthorityType.hashCode()
    return result
  }
  
  
  override function equals(o:Object ):boolean {
    if (!(o typeis Authority)) return false
    final var other = o as Authority
    if (!AuthorityType.equals(other.AuthorityType)) return false
    if (Target != null && !Target.equals(other.Target)) return false
    if (Target == null && other.Target != null) return false
    return true
  }
  
  override function toString() : String {
    return "Auth " + _authorityType + "->" + _target
  }

}
