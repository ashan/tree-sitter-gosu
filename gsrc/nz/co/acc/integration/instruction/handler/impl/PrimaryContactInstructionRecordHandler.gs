package nz.co.acc.integration.instruction.handler.impl

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.integration.instruction.handler.InstructionRecordHandler
uses nz.co.acc.integration.instruction.record.impl.PrimaryContactInstructionRecord

class PrimaryContactInstructionRecordHandler extends InstructionRecordHandler<PrimaryContactInstructionRecord> {

  private static final var _log = StructuredLogger.INTEGRATION.withClass(PrimaryContactInstructionRecordHandler)

  construct(instructionRecord : PrimaryContactInstructionRecord) {
    super(instructionRecord)
  }

  override function processInstructionRecord(bundle : Bundle) {
    var contact = findContact(this.InstructionRecord.PrimaryContactPublicId)
    var account = findAccount(this.InstructionRecord.ACCID)
    var accountContact = findAccountContact(contact, account)
    _log.info("Updating primary contact for ${account}, to contact with publicID ${contact.PublicID}")
    bundle.add(account)
    account.setPrimaryContact_ACC(accountContact)
  }

  private function findAccount(accid : String) : Account {
    var account = Query.make(Account)
        .compare(Account#ACCID_ACC, Relop.Equals, accid)
        .select()
        .FirstResult
    if (account == null) {
      throw new RuntimeException("Account not found with ACCID ${this.InstructionRecord.ACCID}")
    }
    return account
  }

  function findContact(publicID : String) : Contact {
    var contact = Query.make(Contact)
        .compare(Contact#PublicID, Relop.Equals, publicID)
        .select()
        .FirstResult
    if (contact == null) {
      throw new RuntimeException("Contact not found with PublicID ${this.InstructionRecord.PrimaryContactPublicId}")
    }
    return contact
  }

  private function findAccountContact(contact : Contact, account : Account) : AccountContact {
    var query = Query.make(AccountContact)
    query.compare(AccountContact#Contact, Equals, contact)
    query.compare(AccountContact#Account, Equals, account)
    var result = query.select()?.AtMostOneRow
    if (result == null) {
      throw new RuntimeException("AccountContact not found for account with ACCID: ${account.ACCID_ACC}, and contact with publicID: ${contact.PublicID}")
    }
    return result
  }

}