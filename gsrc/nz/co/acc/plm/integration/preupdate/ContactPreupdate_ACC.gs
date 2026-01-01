package nz.co.acc.plm.integration.preupdate

uses entity.Contact
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.system.PCLoggerCategory
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.edge.capabilities.policy.util.PolicyUtil_ACC
uses nz.co.acc.gna.AddressHistoryPreupdate
uses nz.co.acc.history.CustomHistoryHelper_ACC
uses nz.co.acc.plm.integration.apimgmt.events.CustomEvents
uses nz.co.acc.plm.integration.apimgmt.events.EventPredicates

/**
 * Pre-update rules for the {@linkplain Contact} entity.
 *
 * @see IPreUpdateHandler.gwp plugin
 */
class ContactPreupdate_ACC {
  final var _addressHistoryPreupdate = new AddressHistoryPreupdate()
  static final var _instance : ContactPreupdate_ACC as readonly Instance = new ContactPreupdate_ACC()
  private static var LOG = StructuredLogger.CONFIG.withClass(ContactPreupdate_ACC)

  function executePreUpdate(entity : KeyableBean) {
    if (entity typeis Contact) {
      resetEmailVerificationIfPrimaryEmailChanged(entity)
      updateContactAddress(entity)
      raiseAPIMgmtCustomEvents(entity)
      updateContactAddressPolicyTypeFlag(entity)
      updateDummyContactFlagToTrueForUnknownShareholderContact_ACC(entity)
      _addressHistoryPreupdate.updateAddressHistoryIfFlagsChanged(entity)
      CustomHistoryHelper_ACC.createContactHistory(entity)
      updatePolicyAddressOnPrimaryAddressChange(entity)
    }
  }

  private function updateContactAddress(contact : Contact) {
    if (contact.New) {
      if (contact.PrimaryAddress != null) {
        contact.WPCAddress_ACC = contact.PrimaryAddress
        if (contact typeis Person) {
          contact.CPCPXAddress_ACC = contact.PrimaryAddress
        } else if (contact typeis Company) {
          contact.WPSAddress_ACC = contact.PrimaryAddress
        }
      }
    }
  }

  /**
   * Set the dummy contact flag to true for the unknown shareholder (ACC ID = A0000000).
   *
   * @param contact
   */
  private function updateDummyContactFlagToTrueForUnknownShareholderContact_ACC(contact : Contact) {
    if (contact.New and contact.UnknownShareholder_ACC) {
      contact.DummyContact_ACC = true
    }
  }

  /**
   * Raise custom events related to the API management integration.
   *
   * @param contact entity instance
   */
  private function raiseAPIMgmtCustomEvents(contact : Contact) {
    var fn = "raiseAPIMgmtCustomEvents"

    if (contact.New) {
      return;
    }

    switch (contact.Subtype) {
      case typekey.Contact.TC_PERSON:
      case typekey.Contact.TC_COMPANY:
        // Do not proceed if the contact is not associated with an account
        if (contact.AccountContacts == null || contact.AccountContacts.IsEmpty) {
          return;
        }

        if (EventPredicates.check(contact, EventPredicates.PREDICATE_CONTACT)) {
          contact.addEvent(CustomEvents.INTEGRATION_APIMGMT_CONTACT_CHANGED)
        }
        if (EventPredicates.check(contact, EventPredicates.PREDICATE_CONTACT_PRIMARYADDRESS_SWAP)) {
          contact.addEvent(CustomEvents.INTEGRATION_APIMGMT_CONTACT_PRIMARYADDRESS_CHANGED)
        }
        break
      default:
        StructuredLogger.INTEGRATION.debug( this + " " + fn + " " + "No API Management event raised for contact ${contact.PublicID}, type=${typeof contact}")
    }
  }

  private function updateContactAddressPolicyTypeFlag(contact : Contact) {
    var fields = contact.ChangedFields
    fields.each(\fieldToCheck -> {
      switch (fieldToCheck) {

        case Contact.WPCADDRESS_ACC_PROP.Name:
          if (contact.WPCAddress_ACC != null) {
            contact.ContactAddresses.each(\contactAddress -> {
              contactAddress.Address.IsWPCAddress_ACC = false
            })
            contact.PrimaryAddress.IsWPCAddress_ACC = false
            contact.WPCAddress_ACC.IsWPCAddress_ACC = true
          }
          break

        case Contact.WPSADDRESS_ACC_PROP.Name:
          if (contact.WPSAddress_ACC != null) {
            contact.ContactAddresses.each(\contactAddress -> {
              contactAddress.Address.IsWPSAddress_ACC = false
            })
            contact.PrimaryAddress.IsWPSAddress_ACC = false
            contact.WPSAddress_ACC.IsWPSAddress_ACC = true
          }
          break

        case Contact.CPCPXADDRESS_ACC_PROP.Name:
          if (contact.CPCPXAddress_ACC != null) {
            contact.ContactAddresses.each(\contactAddress -> {
              contactAddress.Address.IsCPCPXAddress_ACC = false
            })
            contact.PrimaryAddress.IsCPCPXAddress_ACC = false
            contact.CPCPXAddress_ACC.IsCPCPXAddress_ACC = true
          }
          break

        default:
          break
      }
    })
  }

  private function resetEmailVerificationIfPrimaryEmailChanged(contact : Contact) {
    if (contact.EmailVerifiedDate_ACC != null
        and contact.ChangedFields.contains(Contact.EMAILADDRESS1_PROP.Name)
        and not contact.ChangedFields.contains(Contact.EMAILVERIFIEDDATE_ACC_PROP.Name)) {
      contact.EmailVerifiedDate_ACC = null
    }
  }

  private function updatePolicyAddressOnPrimaryAddressChange(contact:Contact) {
    if (contact.isFieldChanged(Contact#PrimaryAddress) and contact.isNamedInsuredContact_ACC()) {
      LOG.debug("updatePolicyAddressonPrimaryAddressChange - Primary address of PNI is changed for contact ${contact.DisplayName}")
      var policies = contact.AccountContacts.firstWhere(\ac -> ac.Account.ACCID_ACC == contact.ACCID_ACC)?.Account?.Policies
      policies.each(\policy -> {
        var openPeriods = Query.make(PolicyPeriod).compare(PolicyPeriod#Policy, Relop.Equals,policy)
        .compareIn(PolicyPeriod#Status,{PolicyPeriodStatus.TC_DRAFT,PolicyPeriodStatus.TC_QUOTED}).select()
        openPeriods.each(\per -> {
          var bundle = contact.Bundle
          PolicyUtil_ACC.updatePolicyAddressIfNotInSync(per,bundle)
        })
      })
    }
  }
}