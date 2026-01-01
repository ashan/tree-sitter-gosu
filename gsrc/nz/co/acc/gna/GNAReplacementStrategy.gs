package nz.co.acc.gna

/**
 * Created by Mike Ourednik on 15/05/2019.
 */
class GNAReplacementStrategy {

  /**
   * Searches contact addresses for a valid address. The search proceeds in order of the GNA update hierarchy.
   *
   * @param contact
   * @param excludedAddress Optional address to exclude from the search result.
   * @return Optional non-GNA address if one can be found
   */
  public function findValidAddressForReplacingGNAAddress(
      contact : Contact,
      excludedAddress : Optional<Address>) : Optional<Address> {

    var addressFinder : List<block() : Address> = {}
    var newAddress : Address

    if (contact typeis Person) {
      //if contact is individual start looking for CP Postal and Physical
      addressFinder = {
          // Postal Addresses Finder
          \-> getNonGNACPPostalAddress_ACC(contact, excludedAddress),
          \-> getNonGNAWPCPostalAddress_ACC(contact, excludedAddress),

          // Physical Addresses Finder
          \-> getNonGNACPPhysicalAddress_ACC(contact, excludedAddress),
          \-> getNonGNAWPCPhysicalAddress_ACC(contact, excludedAddress)
      }
    } else {
      // if contact is not individual i.e Company
      // Set start looking in WPC postal and physical address
      addressFinder = {
          // Postal Addresses Finder
          \-> getNonGNAWPCPostalAddress_ACC(contact, excludedAddress),
          \-> getNonGNAWPSPostalAddress_ACC(contact, excludedAddress),

          // Physical Addresses Finder
          \-> getNonGNAWPCPhysicalAddress_ACC(contact, excludedAddress),
          \-> getNonGNAWPSPysicalAddress_ACC(contact, excludedAddress)
      }
    }

    var addrIterator = addressFinder.iterator()

    while (newAddress == null && addrIterator.hasNext()) {
      newAddress = addrIterator.next()()
    }

    return Optional.ofNullable(newAddress)
  }


  /**
   * Query to find a GNA based on address policy type
   *
   * @param addressPolicyType
   * @param gnaAddress
   * @return
   */
  private function findNonGNAAdressByPolicyType(
      contact : Contact,
      addressPolicyType : AddressPolicyType_ACC,
      addressLocType : AddressLocationType_ACC,
      gnaAddress : Optional<Address>) : Address {

    var allAddresses = contact.AllAddresses

    if (gnaAddress.Present) {
      allAddresses = allAddresses.where(\address -> address.ID != gnaAddress.get().ID)
    }

    return allAddresses.firstWhere(\address ->
        address.AddressType == AddressType.TC_IRACC &&
            address.AddressLocType_ACC == addressLocType &&
            address.AddressPolicyType_ACC == addressPolicyType &&
            address.ValidUntil == null)
  }

  private function findNonGNAPostalAddressByPolicyType(
      contact : Contact,
      addressPolicyType : AddressPolicyType_ACC,
      gnaAddress : Optional<Address>) : Address {

    return findNonGNAAdressByPolicyType(contact, addressPolicyType, AddressLocationType_ACC.TC_POSTAL, gnaAddress)
  }

  private function findNonGNAPhysicalAddressByPolicyType(
      contact : Contact,
      addressPolicyType : AddressPolicyType_ACC,
      gnaAddress : Optional<Address>) : Address {

    return findNonGNAAdressByPolicyType(contact, addressPolicyType, AddressLocationType_ACC.TC_PHYSICAL, gnaAddress)
  }

  private function getNonGNACPPostalAddress_ACC(contact : Contact, gnaAddress : Optional<Address>) : Address {
    return findNonGNAPostalAddressByPolicyType(contact, AddressPolicyType_ACC.TC_CPCPX, gnaAddress)
  }

  private function getNonGNAWPCPostalAddress_ACC(contact : Contact, gnaAddress : Optional<Address>) : Address {
    return findNonGNAPostalAddressByPolicyType(contact, AddressPolicyType_ACC.TC_WPC, gnaAddress)
  }

  private function getNonGNAWPSPostalAddress_ACC(contact : Contact, gnaAddress : Optional<Address>) : Address {
    return findNonGNAPostalAddressByPolicyType(contact, AddressPolicyType_ACC.TC_WPS, gnaAddress)
  }

  private function getNonGNACPPhysicalAddress_ACC(contact : Contact, gnaAddress : Optional<Address>) : Address {
    return findNonGNAPhysicalAddressByPolicyType(contact, AddressPolicyType_ACC.TC_CPCPX, gnaAddress)
  }

  private function getNonGNAWPCPhysicalAddress_ACC(contact : Contact, gnaAddress : Optional<Address>) : Address {
    return findNonGNAPhysicalAddressByPolicyType(contact, AddressPolicyType_ACC.TC_WPC, gnaAddress)
  }

  private function getNonGNAWPSPysicalAddress_ACC(contact : Contact, gnaAddress : Optional<Address>) : Address {
    return findNonGNAPhysicalAddressByPolicyType(contact, AddressPolicyType_ACC.TC_WPS, gnaAddress)
  }

}