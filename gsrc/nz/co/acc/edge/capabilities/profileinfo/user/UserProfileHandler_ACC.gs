package nz.co.acc.edge.capabilities.profileinfo.user

uses edge.capabilities.helpers.AccountUtil
uses edge.capabilities.profileinfo.user.dto.AccountSummaryDTO
uses edge.capabilities.profileinfo.user.local.IAccountPlugin
uses edge.di.annotations.InjectableNode
uses edge.exception.EntityNotFoundException
uses edge.jsonrpc.IRpcHandler
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.security.EffectiveUserProvider
uses gw.api.locale.DisplayKey
uses nz.co.acc.edge.capabilities.helpers.AccountUtil_ACC

/**
 * ACC User Profile Handler API.
 */
class UserProfileHandler_ACC implements IRpcHandler {

  private var _accountPlugin : IAccountPlugin
  private var _userProvider : EffectiveUserProvider

  @InjectableNode
  @Param("accountPlugin", "plugin used to access account data")
  construct(accountPlugin : IAccountPlugin, aUserProvider: EffectiveUserProvider) {
    this._accountPlugin = accountPlugin
    this._userProvider = aUserProvider
  }

  /**
   * Gets the account contact summary.
   * @return the account contact summary.
   */
  @JsonRpcMethod
  public function getAccountContactSummary() : AccountSummaryDTO {
    final var account = AccountUtil.getUniqueAccount(_userProvider.EffectiveUser)
    return _accountPlugin.getAccountSummary(account)
  }


  /**
   * When the user wishes to update their account contact information,
   * they do so by calling this method. This method does not directly update the
   * account information in the database. Instead, this method creates a note on the account which
   * instructs the adjuster to update the account contact information. The updated information is
   * contained within a note created by this method.
   * @param newAccountSummaryDTO the new account contact summary
   */
  @JsonRpcMethod
  public function updateAccountContactSummary(newAccountSummaryDTO : AccountSummaryDTO) {
    final var account = AccountUtil.getUniqueAccount(_userProvider.EffectiveUser)
    _accountPlugin.updateAccountSummary(account, newAccountSummaryDTO)
  }

  /**
   * Gets the account contact summaries.
   * @return the account contact summaries.
   */
  @JsonRpcMethod
  public function getAccountContactSummaries() : AccountSummaryDTO[] {
    final var accountSummaryDTOList = new LinkedList<AccountSummaryDTO>()
    final var accounts = AccountUtil_ACC.getUserAccounts(_userProvider.EffectiveUser)

    accounts.each(\account -> accountSummaryDTOList.add(_accountPlugin.getAccountSummary(account)))

    if(accountSummaryDTOList.isEmpty()){
      throw new EntityNotFoundException(){
          : Message = DisplayKey.get("Edge.Capabilities.Account.Exception.NoAccountFound"),
          : Data = accounts
          }
    }

    return accountSummaryDTOList.toTypedArray()
  }

}