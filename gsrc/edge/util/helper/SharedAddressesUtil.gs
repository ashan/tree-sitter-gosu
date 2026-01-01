package edge.util.helper

/**
* Diamond/Emerald specific code to link the account holder address to each driver primary address.
*/
class SharedAddressesUtil {

  static function updateSharedAddresses(aSubmission:Submission) {
    var addr = aSubmission.Policy.Account.AccountHolder.AccountContact.Contact.PrimaryAddress
    if ( addr != null ) {
      addr.updateLinkedAddresses()
    }
  }
  
  
  static function linkAddress(target:Address, source:Address) {
    target.linkAddress(source, null)
  }
}
