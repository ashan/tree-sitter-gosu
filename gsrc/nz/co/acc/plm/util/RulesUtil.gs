package nz.co.acc.plm.util

/**
 * Set of utility methods for use by the .grs rule sets.
 */
class RulesUtil {
  private static final var INCLUDED_AEP_CONTRACT_NUMBERS_FOR_AEP_ACCOUNT_CREATION = "IncludedAEPContractNumbersForAEPAccountCreation_ACC"
  private static final var EXCLUDED_AEP_CONTRACT_NUMBERS_FOR_AEP_RELATED_ACCOUNTS = "ExcludedAEPContractNumbersForAEPRelatedAccounts_ACC"

  /**
   * This is the list of special AEP contract numbers that are to be included in the ACC AEP Contract Account
   * account validation rule when creating new AEP contract accounts.
   * @return
   */
  public static function getIncludedAEPContractNumbersForAEPAccountCreation(): List<String> {
    return getAccounts(INCLUDED_AEP_CONTRACT_NUMBERS_FOR_AEP_ACCOUNT_CREATION)
  }

  /**
   * This is the list of special AEP contract numbers that are to be excluded from the related accounts
   * account validation rule when adding relationships.
   * @return
   */
  public static function getExcludedAEPContractNumbersForAEPRelatedAccounts(): List<String> {
    return getAccounts(EXCLUDED_AEP_CONTRACT_NUMBERS_FOR_AEP_RELATED_ACCOUNTS)
  }

  private static function getAccounts(listToRetrieve: String): List<String> {
    var accountsList = new ArrayList<String>()
    var accounts = (ScriptParameters.getParameterValue(listToRetrieve) as String).split("\\|")
    accounts.each(\account -> {
      accountsList.add(account)
    })
    return accountsList
  }

}