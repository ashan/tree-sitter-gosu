package edge.security.authorization

uses edge.di.annotations.ForAllGwNodes
uses java.util.Map
uses java.util.HashMap
uses edge.security.EffectiveUserProvider
uses edge.util.MapUtil
uses gw.lang.reflect.IType

class DefaultAuthorizerPlugin implements IAuthorizerProviderPlugin {
  private var _authorizers : Map<IType,Authorizer>
  protected var _userProvider : EffectiveUserProvider as readonly UserProvider
  
  @ForAllGwNodes
  @Param("auserProvider", "Provider of effective user")
  construct(auserProvider : EffectiveUserProvider) {
    this._userProvider = auserProvider
    _authorizers = new HashMap<IType,Authorizer>()
  }

  override reified function authorizerFor<T>(typeid : Type<T>): Authorizer<T> {
    return MapUtil.getOrUpdate(_authorizers, typeid, \ -> new AllowAllAuthorizer<T>(_userProvider)) as Authorizer<T>
  }

  protected property get Authorizers():Map<IType,Authorizer> {
    return _authorizers
  }
}
