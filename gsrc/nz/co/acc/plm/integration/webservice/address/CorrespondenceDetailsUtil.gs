package nz.co.acc.plm.integration.webservice.address

uses entity.Address
uses gw.api.locale.DisplayKey
uses gw.api.webservice.exception.BadIdentifierException

/**
 * Created by zhangji on 13/06/2017.
 */
class CorrespondenceDetailsUtil {

  function getCorrespondenceDetails(accID : String, policyAddressType : String) : AddressData {
    if (policyAddressType == null) {
      return getCorrespondenceDetails(accID, Optional.empty<AddressPolicyType_ACC>())
    } else {
      var addressPolicyType = AddressPolicyType_ACC.get(policyAddressType)
      return getCorrespondenceDetails(accID, Optional.of(addressPolicyType))
    }
  }


  function getCorrespondenceDetails(accID : String, addressPolicyType : Optional<AddressPolicyType_ACC>) : AddressData {
    var account = Account.finder.findAccountByACCID(accID)
    var primaryContact = account.PrimaryContact_ACC
    if (primaryContact == null) {
      throw new BadIdentifierException(DisplayKey.get("Webservice.Error.CannotFindAccountHldContactForAccountNumber", accID))
    }


    return getCorrespondenceDetails(account, addressPolicyType)
  }

  //When a customers Primary Contact is not the Account Holder, the system should use that Primary Contacts ‘Primary Address’, rather than their policy level addresses.
  // This is because those Primary Contact’s won’t have the policy level addresses for all customer types and this method keeps it consistent.
  function getCorrespondenceDetails(
      account : Account,
      addressPolicyType : Optional<AddressPolicyType_ACC>) : AddressData {
    var address : Address
    var primaryContact = account.PrimaryContact_ACC
    if (!addressPolicyType.Present) {
      address = primaryContact.PrimaryAddress  // only used by AddressAPI, not from policyperiod
    } else {
      switch (addressPolicyType.get()) {
        case AddressPolicyType_ACC.TC_CPCPX:
          address = primaryContact.CPCPXAddress_ACC
          break
        case AddressPolicyType_ACC.TC_WPC:
          address = primaryContact.WPCAddress_ACC
          break
        case AddressPolicyType_ACC.TC_WPS:
          address = primaryContact.WPSAddress_ACC
          break
      }
    }
    if(account.PrimaryContact_ACC != account.AccountHolderContact or address == null){
        address = primaryContact.PrimaryAddress
    }

    return new AddressData(account, address)
  }

}
