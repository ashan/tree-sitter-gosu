package nz.co.acc.edge.capabilities.helpers

uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.exception.EntityNotFoundException
uses edge.exception.EntityPermissionException
uses edge.security.EffectiveUser
uses edge.security.authorization.AuthorityType
uses edge.security.authorization.exception.AuthorizationException
uses entity.AccountContact
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey

/**
 * Created by nitesh.gautam on 3/2/2017.
 */
class AccountUtil_ACC {
  final private static var LOGGER = new Logger(Reflection.getRelativeName(AccountUtil_ACC))

  /**
   * Return unique target for the given authority type.
   *
   * @throws AuthorizationException If user have either no or more than one authority with the given type.
   */
  private static function getUserTarget(effectiveUser : EffectiveUser) : Set<String> {
    final var ids = effectiveUser.getTargets(AuthorityType.ACCOUNT)

    return ids
  }

  /**
   * Find Accounts using the given AccountNumber.
   *
   * @param accountNumbers AccountNumbers for the desired Accounts.
   * @return Accounts with the given AccountNumbers.
   * @throws EntityNotFoundException If an Account cannot be found with the given AccountNumber.
   */
  @Param("accountNumbers", "AccountNumbers for the desired Accounts.")
  @Returns("The Accounts with the given AccountNumbers")
  @Throws(EntityNotFoundException, "If an Account cannot be found with the given AccountNumber.")
  private static function getAccountsByAccountNumbers(accountNumbers : String[]) : Account[] {
    if (accountNumbers == null || accountNumbers.IsEmpty) {
      throw new IllegalArgumentException(DisplayKey.get("Edge.Capabilities.Helpers.Exception.AccountNumbersAreNullOrEmpty"))
    }
    var accounts = gw.api.database.Query.make(entity.Account).compareIn(Account#ACCID_ACC, accountNumbers).select()

    if (accounts == null) {
      throw new EntityNotFoundException() {
        :Message = DisplayKey.get("Edge.Capabilities.Account.Exception.NoAccountFound"),
        :Data = accountNumbers
      }
    }

    return accounts.toTypedArray()
  }

  /**
   * Gets a unique account for the user.
   *
   * @throws AuthorizationException If user have no unique platform account.
   */
  public static function getUserAccounts(effectiveUser : EffectiveUser) : Account[] {
    final var accountIds = getUserTarget(effectiveUser)

    if (accountIds.size() == 0) {
      throw new AuthorizationException() {:Message = DisplayKey.get("Edge.Capabilities.Helpers.Exception.UserDoesNotHavePermissionToViewTheRequestedAccount")}
    }
    return getAccountsByAccountNumbers(accountIds.toTypedArray())
  }

  public static function getTargetUserAccounts(effectiveUser : EffectiveUser) : Set<String> {
    final var accountIds = effectiveUser.getTargets(AuthorityType.ACCOUNT)

    if (accountIds.size() == 0) {
      throw new EntityPermissionException() {
        :Message = DisplayKey.get("Edge.Capabilities.Helpers.Exception.UserDoesNotHavePermissionToViewTheRequestedAccount"),
        :Data = accountIds
      }
    }

    return accountIds
  }

  /**
   * Check if given account is role of account holder
   *
   * @param account Account contact
   * @return true if it's role of account holder
   */
  public static function isAccountHolder(account : AccountContact) : boolean {
    var result = false
    var roles = account.getRoles()
    for (role in roles) {
      if (role.Subtype == typekey.AccountContactRole.TC_ACCOUNTHOLDER) {
        result = true
      }
    }
    return result
  }

  /**
   * Check if account holder has at least one claims address
   *
   * @param accountHolder
   * @return
   */
  public static function hasClaimsAddress(accountHolder : AccountContact) : Boolean {
    var claimsAddressCount = accountHolder.Contact.AllAddresses
        .countWhere(\address -> address.AddressType == AddressType.TC_CLAIMSACC)
    return claimsAddressCount > 0
  }

  public static function findUserByCredential(userName : String) : User {
    var user = Query.make(User)
        .join("Credential").compare("UserName", Equals, userName)
        .select()
        .AtMostOneRow

    if (user == null) {
      throw new EntityNotFoundException() {
        :Message = "User not found",
        :Data = userName,
        :ShowExceptionData = true
      }
    }

    return user
  }

  public static function findGroup(groupName : String) : Group {
    var group = Query.make(Group)
        .compare(Group#Name, Relop.Equals, groupName)
        .select()
        .AtMostOneRow

    if (group == null) {
      throw new EntityNotFoundException() {
        :Message = "Group not found",
        :Data = groupName,
        :ShowExceptionData = true
      }
    }

    return group
  }

  public static function findAssignableQueue(queueName : String) : AssignableQueue {
    var queue = Query.make(AssignableQueue)
        .compare(AssignableQueue#Name, Relop.Equals, queueName)
        .select()
        .AtMostOneRow

    if (queue == null) {
      throw new EntityNotFoundException() {
        :Message = "Queue not found",
        :Data = queueName,
        :ShowExceptionData = true
      }
    }

    return queue
  }

}