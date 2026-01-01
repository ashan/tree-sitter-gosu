package edge.servlet.security

uses edge.di.annotations.ForAllGwNodes
uses javax.servlet.http.HttpServletRequest
uses edge.security.EffectiveUser
uses edge.PlatformSupport.PortalStringUtils
uses java.util.Collections
uses java.lang.Exception
uses edge.security.authorization.Authority
uses edge.servlet.jsonrpc.marshalling.deserialization.DeserializerFactory
uses java.io.StringReader
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.DomReader
uses edge.util.helper.UserUtil

/**
 * Default implementation of user identity plugin compatible with Guidewire Authorization Service.
 */
class DefaultHttpRequestUserIdentityPlugin implements IHttpRequestUserIdentityPlugin {

  /** Deserializer for the user data (permissions and authorities). */
  private static final var EFFECTIVE_USER_DESERIALIZER = DeserializerFactory.INSTANCE.getDeserializer(EffectiveUser)


  @ForAllGwNodes
  construct() {

  }


  /**
   * The Internal GW User that has been authenticated for the portal
   */
  protected function getInternalGWUser(username: String) : User{
    return UserUtil.getUserByName(username)
  }

  override function getEffectiveUserFromRequest(req : HttpServletRequest) : EffectiveUser {
    //Process user information from authentication server
    final var user = req.getHeader("usertoken")
    if(PortalStringUtils.isBlank(user)) {
      return null
    }

    final var internalGwUser = getInternalGWUser(user)
    final var authorized = req.getHeader("Granted-Authorities")

    if(PortalStringUtils.isBlank(authorized)) {
      return new EffectiveUser(user, Collections.emptyList<Authority>(), internalGwUser)
    }

    final var autorizedJson = DomReader.read(new StringReader(authorized))
    final var portalJsonUser = EFFECTIVE_USER_DESERIALIZER.deserialize(autorizedJson) as EffectiveUser

    if (portalJsonUser == null) {
      return new EffectiveUser(user, Collections.emptyList<Authority>(), internalGwUser)
    }

    if (!user.equals(portalJsonUser.Username)) {
      throw new Exception("Transport failure, user name mismatch beteen " + user + " and " + portalJsonUser.Username)
    }

    return new EffectiveUser(user, portalJsonUser.GrantedAuthorities.map(
        \ auth -> new Authority(auth.AuthorityType, auth.Target)).toList(), internalGwUser)
  }

}
