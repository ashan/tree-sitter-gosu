package nz.co.acc.gna

uses entity.Contact
uses gw.api.util.DateUtil

/**
 * Created by Mike Ourednik on 11/11/2020.
 */
class AddressHistoryPreupdate {

  final var _contactAddressFields = {"PrimaryAddress", "CPCPXAddress_ACC", "WPCAddress_ACC", "WPSAddress_ACC"}

  public function updateAddressHistoryIfFlagsChanged(contact : Contact) {
    var changedFields = contact.ChangedFields
    changedFields.retainAll(_contactAddressFields)

    if (!changedFields.Empty) {
      updateAddressHistory(contact, DateUtil.currentDate())
    }
  }

  private function updateAddressHistory(contact : Contact, updateTime : Date) {
    var addressHistory = new AddressHistory_ACC(contact.Bundle)
    addressHistory.Contact = contact
    addressHistory.PrimaryAddress = contact.PrimaryAddress
    addressHistory.CPCPXAddress = contact.CPCPXAddress_ACC
    addressHistory.WPCAddress = contact.WPCAddress_ACC
    addressHistory.WPSAddress = contact.WPSAddress_ACC
    addressHistory.UpdateTime = updateTime
  }

}