package edge.capabilities.profileinfo.user

uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.IRpcHandler
uses edge.capabilities.profileinfo.user.dto.AccountSummaryDTO
uses edge.capabilities.helpers.AccountUtil
uses edge.capabilities.profileinfo.user.local.IAccountPlugin
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.security.EffectiveUserProvider

/**
 * Handler for user profile calls (address, etc...).
 */
final class UserProfileHandler implements IRpcHandler {
  
  private var _accountPlugin : IAccountPlugin
  private var _userProvider : EffectiveUserProvider

  @InjectableNode
  @Param("accountPlugin", "plugin used to access account data")
  construct(accountPlugin : IAccountPlugin, aUserProvider: EffectiveUserProvider) {
    this._accountPlugin = accountPlugin
    this._userProvider = aUserProvider
  }

  @JsonRpcMethod
  public function getAccountContactSummary() : AccountSummaryDTO{
    final var account = AccountUtil.getUniqueAccount(_userProvider.EffectiveUser)
    return _accountPlugin.getAccountSummary(account)
  }
  
  
  /**
   * When the user wishes to update their account contact information,
   * they do so by calling this method. This method does not directly update the
   * account information in the database. Instead, this method creates a note on the account which
   * instructs the adjuster to update the account contact information. The updated information is 
   * contained within a note created by this method.
   */
  @JsonRpcMethod
  public function updateAccountContactSummary(newAccountSummaryDTO : AccountSummaryDTO) {
    final var account = AccountUtil.getUniqueAccount(_userProvider.EffectiveUser)
    _accountPlugin.updateAccountSummary(account, newAccountSummaryDTO)
  }

}
