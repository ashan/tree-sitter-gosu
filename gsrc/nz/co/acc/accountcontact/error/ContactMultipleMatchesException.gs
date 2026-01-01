package nz.co.acc.accountcontact.error

/**
 * Created by Mike Ourednik on 20/03/2019.
 */
class ContactMultipleMatchesException extends ContactRelationshipException {
  construct(message : String) {
    super(message)
  }
}