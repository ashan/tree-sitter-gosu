package nz.co.acc.plm.integration.apimgmt.events

uses entity.AccountContact
uses entity.AccountContactRole
uses entity.Address
uses entity.Contact
uses gw.surepath.suite.integration.logging.StructuredLogger

uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Predicates to capture the relevant data field updates that's accepted by the API Management REST interface. These predicates will be
 * evaluated before raising custom events and processing event-fired rules to filter out irrelevant user actions and data updates.
 */
class EventPredicates {

  /**
   * Predicate function to capture updates to the Account entity.
   */
  public static final var PREDICATE_ACCOUNT: block(bean: KeyableBean): boolean = \bean -> {
    if (not(bean typeis Account)) {
      return false
    }

    var account = bean as Account
    var changedFields = new HashSet<String>(account.ChangedFields)
    changedFields.retainAll({
        Account.ACCID_ACC_PROP.Name,
        Account.IRDNUMBER_ACC_PROP.Name,
        Account.NZBN_ACC_PROP.Name,
        Account.TRADINGNAME_ACC_PROP.Name,
        Account.STATUSOFACCOUNT_ACC_PROP.Name,
        Account.ACCOUNTORGTYPE_PROP.Name,
        Account.RELATIONSHIPMANAGER_ACC_PROP.Name,
        Account.AEPCONTRACTACCOUNT_ACC_PROP.Name,
        Account.AEPCONTRACTNUMBER_ACC_PROP.Name,
        Account.RESTRICTEDACCOUNT_ACC_PROP.Name
    })
    return !changedFields.Empty
  }

  /**
   * Predicate function to capture updates to the AccountContact entity.
   */
  public static final var PREDICATE_ACCOUNTCONTACT: block(bean: KeyableBean): boolean = \bean -> {
    if (not(bean typeis AccountContact)) {
      return false
    }

    var accountContact = bean as AccountContact
    var changedFields = new HashSet<String>(accountContact.ChangedFields)
    changedFields.retainAll({
        AccountContact.ACTIVE_PROP.Name
    })
    return !changedFields.Empty
  }

  /**
   * Predicate function to capture updates to the AccountContactRole entity.
   */
  public static final var PREDICATE_ACCOUNTCONTACTROLE: block(bean: KeyableBean): boolean = \bean -> {
    if (not(bean typeis AccountContactRole)) {
      return false
    }

    var role = bean as AccountContactRole
    var changedFields = new HashSet<String>(role.ChangedFields)
    changedFields.retainAll({
        AccountContactRole.SUBTYPE_PROP.Name,
        Authorised3rdParty_ACC.PARTYRELATION_PROP.Name,
        AuthorisedCompanyEmployee_ACC.EMPLOYEERELATION_PROP.Name,
        AuthorisedCompanyEmployee_ACC.OTHER_PROP.Name
    })
    return !changedFields.Empty
  }

  /**
   * Predicate function to capture updates to the Person (Contact) entity.
   */
  public static final var PREDICATE_CONTACT_PERSON: block(bean: KeyableBean): boolean = \bean -> {
    if (not(bean typeis Person)) {
      return false
    }

    var person = bean as Person
    var changedFields = new HashSet<String>(person.ChangedFields)
    changedFields.retainAll({
        Person.PREFIX_PROP.Name,
        Person.SUFFIX_PROP.Name,
        Person.FIRSTNAME_PROP.Name,
        Person.MIDDLENAME_PROP.Name,
        Person.LASTNAME_PROP.Name,
        Person.GENDER_PROP.Name,
        Person.DATEOFBIRTH_PROP.Name,
        Person.CELLPHONE_PROP.Name,
        Person.CELLPHONECOUNTRY_PROP.Name,
        Person.CELLPHONEEXTENSION_PROP.Name
    })
    return !changedFields.Empty
  }

  /**
   * Predicate function to capture updates to the Company (Contact) entity.
   */
  public static final var PREDICATE_CONTACT_COMPANY: block(bean: KeyableBean): boolean = \bean -> {
    if (not(bean typeis Company)) {
      return false
    }

    var company = bean as Company
    var changedFields = new HashSet<String>(company.ChangedFields)
    changedFields.retainAll({
        Company.CELLPHONE_ACC_PROP.Name,
        Company.CELLPHONECOUNTRY_ACC_PROP.Name,
        Company.CELLPHONEEXTENSION_ACC_PROP.Name
    })
    return !changedFields.Empty
  }

  /**
   * Predicate function to capture updates to the Contact entity, specifically to detect swapping the primary address from one to another.
   */
  public static final var PREDICATE_CONTACT_PRIMARYADDRESS_SWAP: block(bean: KeyableBean): boolean = \bean -> {
    if (not(bean typeis Contact)) {
      return false
    }

    var contact = bean as Contact
    var changedFields = new HashSet<String>(contact.ChangedFields)
    changedFields.retainAll({
        Contact.PRIMARYADDRESS_PROP.Name
    })

    return !changedFields.Empty
  }

  /**
   * Predicate function to capture updates to the Contact entity.
   */
  public static final var PREDICATE_CONTACT: block(bean: KeyableBean): boolean = \bean -> {
    if (not(bean typeis Contact)) {
      return false
    }

    var contact = bean as Contact
    var changedFields = new HashSet<String>(contact.ChangedFields)
    changedFields.retainAll({
        Contact.SUBTYPE_PROP.Name,
        Contact.ACCID_ACC_PROP.Name,
        Contact.NAME_PROP.Name,
        Contact.HOMEPHONE_PROP.Name,
        Contact.HOMEPHONECOUNTRY_PROP.Name,
        Contact.HOMEPHONEEXTENSION_PROP.Name,
        Contact.WORKPHONE_PROP.Name,
        Contact.WORKPHONECOUNTRY_PROP.Name,
        Contact.WORKPHONEEXTENSION_PROP.Name,
        Contact.PRIMARYPHONE_PROP.Name,
        Contact.EMAILADDRESS1_PROP.Name,
        Contact.EMAILADDRESS2_PROP.Name
    })

    return !changedFields.Empty
        || PREDICATE_CONTACT_PERSON(contact)
        || PREDICATE_CONTACT_COMPANY(contact)
  }

  /**
   * Predicate function to capture updates to the Address entity, specifically the PrimaryAddress of a contact.
   */
  public static final var PREDICATE_CONTACT_PRIMARY_ADDRESS: block(bean: KeyableBean): boolean = \bean -> {
    if (not(bean typeis Address)) {
      return false
    }

    var address = bean as Address
    var changedFields = new HashSet<String>(address.ChangedFields)
    changedFields.retainAll({
        Address.ADDRESSLINE1_PROP.Name,
        Address.ADDRESSLINE2_PROP.Name,
        Address.ADDRESSLINE3_PROP.Name,
        Address.POSTALCODE_PROP.Name,
        Address.ATTENTION_ACC_PROP.Name,
        Address.STATE_PROP.Name,
        Address.CITY_PROP.Name,
        Address.COUNTRY_PROP.Name,
        Address.ADDRESSTYPE_PROP.Name,
        Address.ADDRESSLOCTYPE_ACC_PROP.Name
    })
    return !changedFields.Empty
  }

  /**
   * Predicate function to capture updates to the AccountUserRoleAssignment entity.
   */
  public static final var PREDICATE_USERROLEASSIGNMENT: block(bean: KeyableBean): boolean = \bean -> {
    if (not(bean typeis AccountUserRoleAssignment)) {
      return false
    }

    var assignment = bean as AccountUserRoleAssignment
    var changedFields = new HashSet<String>(assignment.ChangedFields)
    changedFields.retainAll({
        AccountUserRoleAssignment.ASSIGNEDUSER_PROP.Name})
    return !changedFields.Empty
  }

  /**
   * Evaluates a predicate against an entity instance.
   *
   * @param bean           entity instance
   * @param predicateBlock predicate function
   * @return true, if predicate returns true. {@code null} predicates will always return true.
   */
  static function check(bean: KeyableBean, predicateBlock(bean: KeyableBean): boolean): boolean {
    var fn = "check"

    if (predicateBlock == null) {
      return true
    }

    var satisfied = predicateBlock(bean)
    if (not satisfied) {
      StructuredLogger.INTEGRATION.debug( EventPredicates.Type.Name + " " + fn + " " + "No predicate satisfied for bean type=${typeof bean} publicId=${bean.PublicID}")
    }
    return satisfied
  }
}