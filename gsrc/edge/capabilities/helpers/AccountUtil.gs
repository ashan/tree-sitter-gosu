package edge.capabilities.helpers

uses edge.exception.EntityNotFoundException
uses edge.security.authorization.AuthorityType
uses java.lang.IllegalArgumentException
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.security.EffectiveUser

/**
 * Provides helper functions to retrieve Account entities
 *
 * This class is included in the diamond and emerald platform packages but is excluded
 * from carbon as ClaimCenter carbon does not have the concept of Account.
 * The file needs to be added to the carbon location for the PolicyCenter and BillingCenter
 * backend modules and excluded from ClaimCenter carbon
 */
class AccountUtil {

  final private static  var LOGGER = new Logger(Reflection.getRelativeName(AccountUtil))

  /**
   * Find an Account using the given AccountNumber.
   *
   * SEARCH STRING: ACC_UPGRADE : CORE CODE CHANGED PLEASE TAKE NOTE DURING UPGRADE
   *
   * @param anAccountNumber An unique identifying AccountNumber for the desired Account.
   * @return The Account with the given AccountNumber.
   * @throws EntityNotFoundException If an Account cannot be found with the given AccountNumber.
   */
  @Param("anAccountNumber", "An unique identifying AccountNumber for the desired Account.")
  @Returns("The Account with the given AccountNumber")
  @Throws(EntityNotFoundException, "If an Account cannot be found with the given AccountNumber.")
  public static function getAccountByAccountNumber(anAccountNumber: String): Account {
    if (anAccountNumber == null || anAccountNumber.Empty){
      throw new IllegalArgumentException("Account number is null or empty")
    }
//    var anAccount = gw.api.database.Query.make(entity.Account).compare("AccountNumber", Equals, anAccountNumber).select().AtMostOneRow
    var anAccount = getAccountByACCnumber(anAccountNumber)

    if(anAccount == null){
      throw new EntityNotFoundException(){
          : Message = "No Account found",
          : Data = anAccountNumber
      }
    }

    return anAccount
  }

  /**
   * gets an account by ACC number
   * @param anAccountNumber
   * @return
   */
  public static function getAccountByACCnumber(anAccountNumber : String) : Account{
    return  gw.api.database.Query.make(entity.Account).compare(Account#ACCID_ACC, Equals, anAccountNumber).select().AtMostOneRow
  }

  /**
   * Gets a unique account for the user.
   *
   * @throws AuthorizationException If user have no unique platform account.
   */
  public static function getUniqueAccount(effectiveUser: EffectiveUser) : Account {
    final var uniqueAccountId = effectiveUser.getUniqueTarget(AuthorityType.ACCOUNT);

    return getAccountByAccountNumber(uniqueAccountId);
  }
}
