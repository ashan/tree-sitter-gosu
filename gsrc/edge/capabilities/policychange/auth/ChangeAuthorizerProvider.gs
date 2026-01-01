package edge.capabilities.policychange.auth

uses edge.security.authorization.Authorizer
uses edge.security.authorization.DefaultAuthorizerPlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUserProvider

class ChangeAuthorizerProvider extends DefaultAuthorizerPlugin {
  @ForAllGwNodes("policychange")
  @Param("aUserProvider", "Provider of effective user")
  construct(aUserProvider : EffectiveUserProvider, policyAuthorizer:Authorizer<PolicyPeriod>) {
    super(aUserProvider)
    Authorizers.put(PolicyPeriod,policyAuthorizer)
  }
}
