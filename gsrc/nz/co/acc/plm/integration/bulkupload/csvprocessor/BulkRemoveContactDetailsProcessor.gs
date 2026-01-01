package nz.co.acc.plm.integration.bulkupload.csvprocessor

uses entity.AccountContact
uses gw.api.database.Query
uses gw.api.database.Relop
uses nz.co.acc.account.error.AccountNotFoundException
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor
uses nz.co.acc.common.integration.bulkupload.csvprocessor.CSVProcessorResult
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError

uses nz.co.acc.plm.integration.bulkupload.csvrowparser.RemoveContactDetailsParser
uses nz.co.acc.plm.integration.bulkupload.csvtypes.RemoveContactDetailsDTO
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.File

/**
 * Created by andersc3 on 27/01/2020.
 */
class BulkRemoveContactDetailsProcessor extends AbstractCSVProcessor<RemoveContactDetailsDTO> {

  private var hasHeaderRow : boolean

  construct(rowParser : IRowParser<RemoveContactDetailsDTO>, updater : BulkUploadProcessUpdater, File : File) {
    super(rowParser, updater, File)
    _log = StructuredLogger.CONFIG.withClass(BulkRemoveContactDetailsProcessor)
  }

  construct() {
    super() // Gunit Testing
    _log = StructuredLogger.CONFIG.withClass(BulkRemoveContactDetailsProcessor)
  }

  static function newInstance(updater : BulkUploadProcessUpdater, uploadFile : File)
      : BulkRemoveContactDetailsProcessor {
    return new BulkRemoveContactDetailsProcessor(new RemoveContactDetailsParser(), updater, uploadFile)
  }

  override function processRows(contactWithDetailsToRemove : List<RemoveContactDetailsDTO>) : CSVProcessorResult {
    _log.info("Importing ${contactWithDetailsToRemove.Count} Contacts.")
    var rowsSuccessful = 0
    var updateCount = 0

    var rowProcessErrors = new ArrayList<RowProcessError>()

    for (contact in contactWithDetailsToRemove index i) {
      var rowNumber = i + 1
      var lineNumber = i + 2

      var removeContactDetailsDTO : RemoveContactDetailsDTO
      try {
        gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
          removeContactDetailsDTO = contact
          _log.info("Processing ${removeContactDetailsDTO.ACCNumber}.")
          // retrieve contacts for accNumber passed in
          var account = validateAccount(removeContactDetailsDTO.ACCNumber)

          if (removeContactDetailsDTO.contactRole != null) {
            // we know the contact role and in some cases there could be more than one
            var accountContacts = account.AccountContacts
                .where(\accountContact -> accountContact.Roles
                    .hasMatch(\role -> role.Subtype == removeContactDetailsDTO.contactRole))
            _log.info("Found ${accountContacts.Count} accountContacts with role ${removeContactDetailsDTO.contactRole}.")
            for (accountContact in accountContacts) {
              accountContact = bundle.add(accountContact)
              if (accountContact != null) {
                _log.info("Removing details for account contact ${accountContact.PublicID}")
                removeContactDetails(accountContact, removeContactDetailsDTO)
              } else {
                throw new IllegalStateException("A contact must have a valid role. " +
                    "${removeContactDetailsDTO.contactRole} on ${removeContactDetailsDTO.ACCNumber} is not valid")
              }
            }
          } else {
            // No role provided, need to iterate through the contacts
            _log.info("No contact role specified. Removing from all contacts on account")
            var accountContacts = account.AccountContacts
            for (accountContact in accountContacts) {
              accountContact = bundle.add(accountContact)
              if (accountContact != null) {
                _log.info("Processing account contact ${accountContact.PublicID}")
                removeContactDetails(accountContact, removeContactDetailsDTO)
              }
            }
            _log.info("Completed removing details by account contacts.")
          }
        })
        rowsSuccessful += 1
        onSuccess()
      } catch (e : Exception) {
        _log.error_ACC("Removing contact details failed for ${removeContactDetailsDTO.ACCNumber}", e)
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
      }
    }
    _log.info("Finished importing ${contactWithDetailsToRemove.Count} Contacts.")
    return new CSVProcessorResult(rowsSuccessful, rowProcessErrors)
  }

  public function removeContactDetails(contact : AccountContact, removeContactDetailsDTO : RemoveContactDetailsDTO) {
    var updateCount = 0

    if (contact.Contact.EmailAddress1 != null and
        contact.Contact.EmailAddress1.equalsIgnoreCase(removeContactDetailsDTO.emailAddress)) {
      contact.Contact.EmailAddress1 = null
      updateCount++
    }
    if (contact.Contact.EmailAddress2 != null and
        contact.Contact.EmailAddress2.equalsIgnoreCase(removeContactDetailsDTO.emailAddress)) {
      contact.Contact.EmailAddress2 = null
      updateCount++
    }
    if (contact.Contact.HomePhone != null and
        isPhoneNumberAMatch(contact.Contact.HomePhone, removeContactDetailsDTO.phoneNumber)) {
      contact.Contact.HomePhone = null
      updateCount++
    }
    if (contact.Contact.WorkPhone != null and
        isPhoneNumberAMatch(contact.Contact.WorkPhone, removeContactDetailsDTO.phoneNumber)) {
      contact.Contact.WorkPhone = null
      updateCount++
    }
    if (contact.Contact.FaxPhone != null and
        isPhoneNumberAMatch(contact.Contact.FaxPhone, removeContactDetailsDTO.phoneNumber)) {
      contact.Contact.FaxPhone = null
      updateCount++
    }
    if (contact.Contact typeis Person) {
      if (contact.Contact.CellPhone != null and
          isPhoneNumberAMatch(contact.Contact.CellPhone, removeContactDetailsDTO.phoneNumber)) {
        contact.Contact.CellPhone = null
        updateCount++
      }
    }
    if (contact.Contact typeis Company) {
      if (contact.Contact.CellPhone_ACC != null and
          isPhoneNumberAMatch(contact.Contact.CellPhone_ACC, removeContactDetailsDTO.phoneNumber)) {
        contact.Contact.CellPhone_ACC = null
        updateCount++
      }
    }
  }

  public function validateAccount(accNumber : String) : Account {
    var account = Query.make(Account)
        .compare(Account#ACCID_ACC, Relop.Equals, accNumber)
        .select()
        .AtMostOneRow
    if (account == null) {
      throw new AccountNotFoundException("Account number: ${accNumber} doesn't exist")
    } else {
      return account
    }
  }

  public function isPhoneNumberAMatch(phoneNumberOnRecord : String, phoneNumberToRemove : String) : boolean {
    // the phoneNumberToRemove has been through the GWPhoneParser and will be in a valid format with hypens removed
    // but the stored phone number doesn't have any + or hypens
    if (phoneNumberOnRecord != null and phoneNumberToRemove != null) {
      if (phoneNumberToRemove.equalsIgnoreCase(phoneNumberOnRecord)) {
        // it's a direct match
        return true
      } else if (phoneNumberOnRecord.containsIgnoreCase(phoneNumberToRemove)) {
        // the phone number on record is longer than the one coming in
        return true
      } else if (phoneNumberToRemove.containsIgnoreCase(phoneNumberOnRecord)) {
        // the phone number coming in is longer than the one on record
        return true
      } else {
        return false
      }
    } else {
      return false
    }
  }
}

