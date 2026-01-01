package nz.co.acc.accountcontact.error

/**
 * Created by Mike Ourednik on 12/03/2019.
 */
class ContactNotFoundException extends ContactRelationshipException {
  construct(message : String) {
    super(message)
  }
}