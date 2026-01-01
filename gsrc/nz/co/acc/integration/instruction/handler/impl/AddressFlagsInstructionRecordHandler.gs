package nz.co.acc.integration.instruction.handler.impl

uses entity.Address
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.integration.instruction.handler.InstructionRecordHandler
uses nz.co.acc.integration.instruction.record.impl.AddressFlagsInstructionRecord
uses entity.Contact

class AddressFlagsInstructionRecordHandler extends InstructionRecordHandler<AddressFlagsInstructionRecord> {
  private static final var _log = StructuredLogger.INTEGRATION.withClass(AddressFlagsInstructionRecordHandler)

  construct(instructionRecord : AddressFlagsInstructionRecord) {
    super(instructionRecord)
  }

  override function processInstructionRecord(bundle : Bundle) {
    // Find entities
    var contact = findContact(this.InstructionRecord.ContactPublicID)
    var contactAddresses = contact.AllAddresses
    var primaryAddress = findAddress(this.InstructionRecord.PrimaryAddressPublicID)
    var cpcpxAddress = findAddress(this.InstructionRecord.CPCPXAddressPublicID)
    var wpcAddress = findAddress(this.InstructionRecord.WPCAddressPublicID)
    var wpsAddress = findAddress(this.InstructionRecord.WPSAddressPublicID)

    assertAddressIsContactAddress(contact, contactAddresses, primaryAddress)
    assertAddressIsContactAddress(contact, contactAddresses, cpcpxAddress)
    assertAddressIsContactAddress(contact, contactAddresses, wpcAddress)
    assertAddressIsContactAddress(contact, contactAddresses, wpsAddress)

    // Update
    _log.info("Updating address flags for Contact PublicID=${contact.PublicID}")
    contact = bundle.add(contact)
    if (primaryAddress != null) {
      contact.makePrimaryAddress(primaryAddress)
    }
    if (cpcpxAddress != null) {
      contact.CPCPXAddress_ACC = cpcpxAddress
    }
    if (wpcAddress != null) {
      contact.WPCAddress_ACC = wpcAddress
    }
    if (wpsAddress != null) {
      contact.WPSAddress_ACC = wpsAddress
    }
  }

  function findContact(publicID : String) : Contact {
    var contact = Query.make(Contact)
        .compare(Contact#PublicID, Relop.Equals, publicID)
        .select()
        .FirstResult
    if (contact == null) {
      throw new RuntimeException("Contact not found with PublicID ${this.InstructionRecord.ContactPublicID}")
    }
    return contact
  }

  function findAddress(publicID : String) : Address {
    if (publicID?.NotBlank) {
      var address = Query.make(Address)
          .compare(Address#PublicID, Relop.Equals, publicID)
          .select()
          .FirstResult
      if (address == null) {
        throw new RuntimeException("Address not found with PublicID ${publicID}")
      }
      return address
    } else {
      return null
    }
  }

  function assertAddressIsContactAddress(
      contact : Contact,
      contactAddresses : Address[],
      address : Address) {
    if (address == null) {
      return
    }
    var isContactAddress = contactAddresses.hasMatch(\contactAddress -> address.PublicID == contactAddress.PublicID)
    if (!isContactAddress) {
      throw new RuntimeException("Address PublicID=${address.PublicID} is not a contact address for Contact PublicID=${contact.PublicID}")
    }
  }
}