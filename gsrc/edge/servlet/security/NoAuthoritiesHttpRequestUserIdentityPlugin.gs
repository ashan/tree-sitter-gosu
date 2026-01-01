package edge.servlet.security

uses javax.servlet.http.HttpServletRequest
uses edge.security.EffectiveUser
uses edge.PlatformSupport.PortalStringUtils
uses java.util.Collections
uses edge.security.authorization.Authority
uses edge.di.annotations.InjectableNode
uses edge.Plugin.ProducerCodeRetrieverPlugin
uses edge.security.authorization.AuthorityType
uses edge.util.helper.UserUtil

class NoAuthoritiesHttpRequestUserIdentityPlugin implements IHttpRequestUserIdentityPlugin {

  private var producerCodeRetrieverPlugin: ProducerCodeRetrieverPlugin

  @InjectableNode
  construct() {
      producerCodeRetrieverPlugin = new ProducerCodeRetrieverPlugin ()
  }

  override function getEffectiveUserFromRequest(req : HttpServletRequest) : EffectiveUser {

    final var user = req.getHeader("usertoken")
    if(PortalStringUtils.isBlank(user)) {
      return null
    }

    var producerCodes = producerCodeRetrieverPlugin.retrieveProducerCodesByUserName(user)

    var grantedAuthorities = producerCodes.map(
        \ producerCode -> new Authority(AuthorityType.PRODUCER, producerCode.Code))


    return new EffectiveUser(user, grantedAuthorities, UserUtil.getUserByName(user))
  }

}
