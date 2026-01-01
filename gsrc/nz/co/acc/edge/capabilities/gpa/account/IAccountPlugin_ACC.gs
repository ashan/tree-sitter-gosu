package nz.co.acc.edge.capabilities.gpa.account

uses edge.capabilities.gpa.account.IAccountPlugin
uses entity.Activity
uses nz.co.acc.edge.capabilities.address.dto.AddressDTO_ACC
uses nz.co.acc.edge.capabilities.gpa.account.dto.AccountDTO_ACC
uses nz.co.acc.edge.capabilities.gpa.account.dto.ActivityDTO_ACC
uses nz.co.acc.edge.capabilities.gpa.account.dto.HistoryDTO_ACC
uses nz.co.acc.edge.capabilities.accountcontact.dto.AccountContactDTO_ACC

/**
 * Created by nitesh.gautam on 7/03/2017.
 */
interface IAccountPlugin_ACC extends IAccountPlugin {
  public function accountContactDetailsToDTO(anAccountContact: entity.AccountContact): AccountContactDTO_ACC

  public property get Accounts(): AccountDTO_ACC[]

  public function findEffectiveUserAccount(): Account

  public function deleteAccountContact(accNumber: String, accountContactPublicId: String)

  public function updateAccountContact(accNumber: String, accountContactDTO: AccountContactDTO_ACC, reason : String): AccountContactDTO_ACC

  public function activityBaseDetailsToDTO(anActivity: Activity): ActivityDTO_ACC

  public function getAccountHistory(accNumber: String): HistoryDTO_ACC[]

  public function verifyAccountExists(accNumber: String): Boolean

  public function createAccountHolderAddress(addressDTO: AddressDTO_ACC): AddressDTO_ACC

  public function updateAccountHolderAddress(addressDTO: AddressDTO_ACC): AddressDTO_ACC
}