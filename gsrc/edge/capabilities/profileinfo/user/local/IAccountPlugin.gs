package edge.capabilities.profileinfo.user.local

uses edge.capabilities.profileinfo.user.dto.AccountSummaryDTO

/**
 * Plugin used to access accounts.
 */
interface IAccountPlugin {
  /** Fetches account summary for the given account. */
  function getAccountSummary(account : Account) : AccountSummaryDTO
  
  /**
   * Updates account summary with a new data.
   */
  function updateAccountSummary(account : Account, summary : AccountSummaryDTO)
}
