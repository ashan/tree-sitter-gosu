package edge.capabilities.gpa.account

uses edge.exception.EntityNotFoundException
uses edge.exception.EntityPermissionException

/**
 * Plugin interface used for retrieval account(s) available for the agent.
 */
interface IAccountRetrievalPlugin {
  /**
   * Find an Account using the given AccountNumber.
   *
   * @param anAccountNumber An unique identifying AccountNumber for the desired Account.
   * @return The Account with the given AccountNumber.
   * @throws EntityNotFoundException If an Account cannot be found with the given AccountNumber.
   * @throws EntityPermissionException If the user does not have permission to view the Account found with the given AccountNumber.
   */
  @Param("anAccountNumber", "An unique identifying AccountNumber for the desired Account.")
  @Returns("The Account with the given AccountNumber")
  @Throws(EntityNotFoundException, "If an Account cannot be found with the given AccountNumber.")
  @Throws(EntityPermissionException, "If the user does not have permission to view the Account found with the given AccountNumber.")
  public function getAccountByNumber(anAccountNumber: String): Account
}
