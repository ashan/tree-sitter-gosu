package nz.co.acc.plm.integration.preupdate

uses entity.Address
uses entity.Contact
uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.Relop
uses nz.co.acc.history.CustomHistoryHelper_ACC
uses nz.co.acc.plm.integration.apimgmt.events.CustomEvents
uses nz.co.acc.plm.integration.apimgmt.events.EventPredicates
uses nz.co.acc.plm.integration.ir.util.BundleHelper

/**
 * Address Preupdate class
 *
 * @see IPreUpdateHandler.gwp plugin
 * <p>
 * Created by Nick on 9/05/2017.
 */
class AddressPreupdate_ACC {

  static final var _instance : AddressPreupdate_ACC as readonly Instance = new AddressPreupdate_ACC()

  public function executePreUpdate(address : Address) {
    setUpdateTime(address)
    setDefaultClaimsLocationType(address)
    syncLinkedContactAsPrimaryAddress(address)
    raiseAPIMgmtCustomEvents(address)
    CustomHistoryHelper_ACC.createAddressHistory(address)
  }

  private function setDefaultClaimsLocationType(address : Address) {
    if (address.isFieldChanged(Address#AddressType)) {
      if ((address.AddressType == AddressType.TC_CLAIMSACC or
          address.AddressType == AddressType.TC_AGENTACC) and
          address.AddressLocType_ACC != AddressLocationType_ACC.TC_POSTAL) {
        address.AddressLocType_ACC = AddressLocationType_ACC.TC_POSTAL
      }
    }
  }

  private function setUpdateTime(address : Address) {
    if (address.AddressType != AddressType.TC_IRACC and
        (address.isFieldChanged(Address#AddressLine1) or
            address.isFieldChanged(Address#City) or
            address.isFieldChanged(Address#State) or
            address.isFieldChanged(Address#Country) or
            address.isFieldChanged(Address#PostalCode))) {
      address.UpdateTime_ACC = Date.Now
    }
  }

  /**
   * Raise custom events related to the API management integration.
   *
   * @param address entity instance
   */
  private function raiseAPIMgmtCustomEvents(address : Address) {
    if (not EventPredicates.check(address, EventPredicates.PREDICATE_CONTACT_PRIMARY_ADDRESS)) {
      return
    }

    // The following condition was introduced for the address updates performed by the IR integration framework.
    // The IR framework deals with entity AccountLocation, instead of entity Address, when updating addresses.
    //
    // If change is for an AccountLocation and the associated Account is new,
    // do not proceed as address data will be sent to api management as part of the full payload generated for the new account.
    if (address typeis AccountLocation && (address as AccountLocation).Account.New) {
      return
    }

    var contacts = findLinkedContactsAsPrimaryAddress(address)
    contacts.each(\contact -> {
      if (not contact.AccountContacts.IsEmpty) {
        var eContact = BundleHelper.explicitlyAddBeanToBundle(address.Bundle, contact, false)
        eContact.addEvent(CustomEvents.INTEGRATION_APIMGMT_CONTACT_PRIMARYADDRESS_CHANGED)
      }
    })
  }

  private function findLinkedContactsAsPrimaryAddress(address : Address) : IQueryBeanResult<Contact> {
    var query = Query.make(Contact)
    query.compare(Contact#PrimaryAddress, Relop.Equals, address)
    query.compareIn(Contact#Subtype, {typekey.Contact.TC_PERSON, typekey.Contact.TC_COMPANY})
    return query.select() as IQueryBeanResult<Contact>
  }

  /**
   * Syncronize contact search denorm properties on the contact that use the updated address as primary address
   * @param address instance
   */
  private function syncLinkedContactAsPrimaryAddress(address : Address) {
    if (address.isFieldChanged(Address#City) or
        address.isFieldChanged(Address#State) or
        address.isFieldChanged(Address#Country) or
        address.isFieldChanged(Address#PostalCode)) {
      var targetSyncContacts = findLinkedContactsAsPrimaryAddress(address)
      if (targetSyncContacts.HasElements) {
        var bundle = address.getBundle()
        address.touch()
        foreach (contact in targetSyncContacts) {
          contact = bundle.add(contact)
          contact.touch()
        }
      }
    }
  }


}
