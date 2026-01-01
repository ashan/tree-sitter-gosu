package nz.co.acc.integration.instruction.handler.impl

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.integration.instruction.handler.InstructionRecordHandler
uses nz.co.acc.integration.instruction.record.impl.AddressEndDateInstructionRecord

class AddressEndDateInstructionRecordHandler extends InstructionRecordHandler<AddressEndDateInstructionRecord> {
  private static final var _log = StructuredLogger.INTEGRATION.withClass(AddressEndDateInstructionRecordHandler)

  construct(instructionRecord : AddressEndDateInstructionRecord) {
    super(instructionRecord)
  }

  override function processInstructionRecord(bundle : Bundle) {
    var addressPublicID = this.InstructionRecord.AddressPublicID
    var address = findAddress(addressPublicID)
    if (address == null) {
      throw new RuntimeException("Address not found with PublicID=${addressPublicID}")
    } else {
      _log.info("Setting end date for address with PublicID=${address.PublicID}")
      address = bundle.add(address)
      address.ValidUntil = Date.Today
    }
  }

  function findAddress(publicID : String) : Address {
    return Query.make(Address)
        .compare(Address#PublicID, Relop.Equals, publicID)
        .select()
        .FirstResult
  }
}