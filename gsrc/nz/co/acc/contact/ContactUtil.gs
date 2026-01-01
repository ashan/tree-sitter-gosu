package nz.co.acc.contact

uses gw.api.database.Query
uses gw.api.database.Relop
uses entity.Contact
uses gw.pl.persistence.core.Bundle

/**
 * ACC Utility class for Contact related operations
 * <p>
 * Created by Ian Rainford on 14/02/2017.
 */
class ContactUtil {
  /**
   * Returns true if a contact with the given TaxID (ACC Number / Account number) number exists, false otherwise.
   *
   * @param ACCNumber the ACC number to search against.
   */
  public static function contactExists(ACCNumber : String) : boolean {
    var accountQuery = Query.make(Contact).compare(Contact#ACCID_ACC, Equals, ACCNumber)
    return accountQuery.select().HasElements
  }

  /**
   * Return the Contact based ACCID and subtype, and add to the bundle if one provided.
   *
   * @param firstName
   * @param lastName
   * @return the Person Contact
   */
  public static function getContact(accNumber : String, contactType : typekey.Contact, bundle : Bundle) : Contact {
    var query = Query.make(Contact)
    query.compare(Contact#ACCID_ACC, Equals, accNumber)
    query.compare(Contact#Subtype, Equals, contactType)
    var contact = query.select().AtMostOneRow
    if (contact != null && bundle != null) {
      contact = bundle.add(contact)
    }
    return contact
  }

  /**
   * Return the Person Contact based on first name and last name
   *
   * @param firstName
   * @param lastName
   * @return the Person Contact
   */
  public static function getContact(firstName : String, lastName : String) : Person {
    return Query.make(Person)
        .compare(Person#FirstName, Relop.Equals, firstName)
        .compare(Person#LastName, Relop.Equals, lastName)
        .select()
        .first()
  }

  /**
   * Returns a Company contact distinctly identifiable by name.
   *
   * @param name
   * @return
   */
  public static function getCompanyContact(name : String) : Company {
    return Query.make(Company).compare(Company#Name, Relop.Equals, name).select().AtMostOneRow
  }

  public static function getCompanyContactWithACCID(accID : String) : Company {
    return Query.make(Company).compare(Company#ACCID_ACC, Relop.Equals, accID).select().AtMostOneRow
  }

  public static function getPersonContactWithACCID(accID : String) : Person {
    return Query.make(Person).compare(Person#ACCID_ACC, Relop.Equals, accID).select().AtMostOneRow
  }

  /**
   * Return true if the given contact has the role
   *
   * @param contact - the Contact
   * @param role    - The role
   * @return true is role exists in contact
   */
  public static function containsRole(contact : Contact, role : typekey.AccountContactRole) : boolean {
    for (accountContact in contact.AccountContacts) {
      if (accountContact.hasRole(role)) {
        return true
      }
    }
    return false
  }

  public static function validateContact(contact : Contact) : String {
    // If the ACC ID is the dummy contact ACC ID then set the dummy contact flag to true and set the auto sync to disallow
    var dummyContactACCID = ScriptParameters.getParameterValue("DummyContactACCID_ACC") as String
    if (contact.ACCID_ACC == dummyContactACCID) {
      contact.AutoSync = AutoSync.TC_DISALLOW
      contact.DummyContact_ACC = true
    }
    return null
  }
}
