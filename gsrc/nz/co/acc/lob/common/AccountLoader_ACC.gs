package nz.co.acc.lob.common

uses gw.api.locale.DisplayKey
uses nz.co.acc.contact.ContactUtil

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.lang.invoke.MethodHandles

/**
 * Created by Farooq Ali on 12/09/2017.
 */
class AccountLoader_ACC {
  private static final var INTEGRATION_ACCOUNT_ACC_1 = "TechAccount001"
  private static final var INTEGRATION_ACCOUNT_ACC_2 = "TechAccount002"
  private static final var UNKNOWN_SHAREHOLDER_CONTACT_NAME = "Unknown Shareholder"
  private static final var UNKNOWN_SHAREHOLDER_CONTACT_ACCID = "A0000000"

  private static final var _logger = StructuredLogger.CONFIG.withClass(MethodHandles.lookup().lookupClass())
  /**
   * Loads the technical entities that are needed as part of the initial Policy Center data setup
   */

  public function loadTechnicalEntities() : String {
    //DE1076 - Creates unknown shareholder
    createUnknownShareholderContact()

    //Load techical accounts
    return loadTechnicalAccounts()
  }

  /**
   * Loads the technical accounts that are needed as part of the initial Policy Center data setup
   * @return
   */
  private function loadTechnicalAccounts() : String {
    logDebug("loadTechnicalAccounts", "Begin: Check and create technical accounts")

    if (checkIfAlreadyExists(INTEGRATION_ACCOUNT_ACC_1) and checkIfAlreadyExists(INTEGRATION_ACCOUNT_ACC_2)) {
      return DisplayKey.get("Web.Admin.LoadTechnicalAccounts_ACC.AlreadyCreated")
    } else {
      logInfo("loadTechnicalAccounts", "Going to create technical account(s)")
      createAccount(INTEGRATION_ACCOUNT_ACC_1, "ACC Juno Outbound Framework Technical Account", getTechAccountsAddress())
      createAccount(INTEGRATION_ACCOUNT_ACC_2, "ACC Juno Outbound Framework Technical Account", getTechAccountsAddress())
      logInfo("loadTechnicalAccounts", "Finished creating technical account(s)")
    }
    logDebug("loadTechnicalAccounts", "End: Check and create technical accounts")

    return DisplayKey.get("Web.Admin.LoadTechnicalAccounts_ACC.Success")
  }

  private function createUnknownShareholderContact() {
    if (ContactUtil.contactExists(UNKNOWN_SHAREHOLDER_CONTACT_ACCID)) {
      logInfo("createUnknownShareholderContact", "Create " + UNKNOWN_SHAREHOLDER_CONTACT_NAME + " already created")
      return
    }

    var firstName = UNKNOWN_SHAREHOLDER_CONTACT_NAME.split(" ")[0]
    var lastName = UNKNOWN_SHAREHOLDER_CONTACT_NAME.split(" ")[1]

    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      var contact = new Person(bundle)
      contact.Name = UNKNOWN_SHAREHOLDER_CONTACT_NAME
      contact.FirstName = firstName
      contact.LastName = lastName
      contact.ACCID_ACC = UNKNOWN_SHAREHOLDER_CONTACT_ACCID
      contact.PrimaryAddress = getTechAccountsAddress()
    })
    logInfo("createUnknownShareholderContact", "Create '" + UNKNOWN_SHAREHOLDER_CONTACT_NAME + "' " + UNKNOWN_SHAREHOLDER_CONTACT_ACCID)
  }

  /**
   * Does the actual work of creating the account(s)
   * @param accID
   * @param accountName
   * @param techAccountsAddress
   */
  private function createAccount(accID: String, accountName: String, techAccountsAddress: Address) {
    var theAccount: Account
    try {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        var contact1 = new Company(bundle)
        contact1.Name = accountName
        contact1.ACCID_ACC = accID
        contact1.PrimaryAddress = techAccountsAddress
        theAccount = Account.createAccountForContact(contact1)
        theAccount.OriginationDate = Date.Today
        theAccount.StatusOfAccount_ACC = StatusOfAccount_ACC.TC_ACTIVE
        theAccount.AccountNumber = accID
        theAccount.updateAccountHolderContact()
      })
    } catch (exception) {
      logError("createAccount", exception.toString())
    }
  }

  /**
   * Returns dummy address for tech accounts
   * @return
   */
  private function getTechAccountsAddress(): Address {
    var address = new Address()
    address.AddressType = AddressType.TC_PREFERREDACC
    address.AddressLocType_ACC = AddressLocationType_ACC.TC_POSTAL
    address.AddressLine1 = "PO Box 2521"
    address.City = "Wellington"
    address.PostalCode = "6140"
    address.Country = Country.TC_NZ

    return address
  }

  /**
   * Returns whether we have an account already by that name
   * @param accountNumber
   * @return
   */
  private function checkIfAlreadyExists(accountNumber: String): boolean {
    logDebug("checkIfAlreadyExists", "Checking whether account number ${accountNumber} exists already..")

    return Account.finder.findAccountByAccountNumber(accountNumber) != null
  }

  /**
   * Utility  method for logging info messages
   * @param fn
   * @param msg
   */
  private static function logInfo(fn: String, msg: String) {
    _logger.info(msg)
  }
  /**
   * Utility  method for logging debug messages
   * @param fn
   * @param msg
   */
  private static function logDebug(fn: String, msg: String) {
    _logger.debug(msg)
  }
  /**
   * Utility  method for logging error messages
   * @param fn
   * @param msg
   */
  private static function logError(fn: String, msg: String) {
    _logger.error_ACC(msg)
  }
}