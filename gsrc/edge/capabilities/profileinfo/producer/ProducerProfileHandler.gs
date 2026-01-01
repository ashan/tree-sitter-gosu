package edge.capabilities.profileinfo.producer

uses edge.jsonrpc.IRpcHandler
uses edge.security.EffectiveUserProvider
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.helpers.AccountUtil
uses edge.capabilities.profileinfo.producer.local.IProducerPlugin
uses edge.capabilities.profileinfo.producer.dto.ProducerSummaryDTO

/**
 * Handler for producer profile calls.
 */
final class ProducerProfileHandler implements IRpcHandler {
  private var _accountPlugin : IProducerPlugin
  private var _userProvider : EffectiveUserProvider

  @InjectableNode
  @Param("accountPlugin", "plugin used to access account data")
  construct(accountPlugin : IProducerPlugin, aUserProvider: EffectiveUserProvider) {
    this._accountPlugin = accountPlugin
    this._userProvider = aUserProvider
  }

  /**/
  @JsonRpcMethod
  public function getProducerContactSummary() : ProducerSummaryDTO {
    final var account = AccountUtil.getUniqueAccount(_userProvider.EffectiveUser)
    return _accountPlugin.getProducerSummary(account)
  }
}
