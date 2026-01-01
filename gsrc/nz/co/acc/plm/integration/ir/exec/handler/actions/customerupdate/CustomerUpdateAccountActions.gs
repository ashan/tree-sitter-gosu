package nz.co.acc.plm.integration.ir.exec.handler.actions.customerupdate

uses entity.AccountContact
uses entity.Address
uses entity.Contact
uses gw.api.util.DateUtil
uses gw.api.util.DisplayableException
uses gw.api.util.ExternalIDUtil
uses gw.api.util.PhoneUtil
uses gw.pl.persistence.core.Bundle
uses gw.util.GosuStringUtil
uses nz.co.acc.common.GenericConstants

uses nz.co.acc.contact.ContactUtil
uses nz.co.acc.integration.ir.record.CREGRecord
uses nz.co.acc.integration.ir.record.util.IRConstants
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses nz.co.acc.gna.GNAReplacementStrategy
uses nz.co.acc.plm.integration.ir.exec.handler.AddressValidationAPIException
uses nz.co.acc.plm.integration.validation.addressvalidation.AddressMetadata_ACC
uses nz.co.acc.plm.integration.validation.addressvalidation.AddressValidationAPI_ACC
uses nz.co.acc.plm.integration.validation.nzbnvalidation.MBIEAPIClient
uses gw.surepath.suite.integration.logging.StructuredLogger
uses org.apache.commons.validator.routines.EmailValidator
uses typekey.PolicyLine

uses java.lang.invoke.MethodHandles

/**
 * Customer update account create/update.
 * <p>
 * Created by Swati Patel on 30/01/2017.
 */
class CustomerUpdateAccountActions {

  private static final var _log = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())

  // Currency does not come through from IRD
  private static final var NZD = Currency.TC_NZD

  // These need to match the addresss properties on CustomerUpdateData class
  // @link nz.co.acc.plm.integration.ir.exec.handler.data.CustomerUpdateData
  // as we use reflection to set the address lines
  private static final var ADDRESS_LINE1 = "Line1"
  private static final var ADDRESS_LINE2 = "Line2"
  private static final var POSTAL_CODE = "Postalcode"
  private static final var CHANGE_DATE = "ChangeDate"

  // We use this to keep track of whether we've performed a lookup for a particular address already.
  // If so don't lookup again, just use the previous result.
  private var _previousAddressSearchQuery : String
  private var _addressMetadata : AddressMetadata_ACC = null

  // We use these to construct address properties to use via reflection
  private static final var POSTAL_TYPE = "PostalAddress"
  private static final var PHYSICAL_TYPE = "PhysicalAddress"

  // Names come in space delimited
  private static final var NAME_DELIMITER = " "
  // We will split the name into 2 bits
  private static final var NAME_TOKENS = 2
  // Leave this as lowercase as we use it for comparison purposes
  private static final var NAME_DECEASED = "deceased"

  // Length of the IRD Number portion in the IrdReferenceNumber field
  private static final var IRD_NUMBER_LENGTH = 9

  private var _isIndividual : boolean
  private var _customerUpdateData : CREGRecord
  private var _policyLineType : typekey.PolicyLine

  private var _mbieClient : MBIEAPIClient

  construct(policyLineType : typekey.PolicyLine, data : CREGRecord, mbieClient : MBIEAPIClient) {
    _policyLineType = policyLineType
    _customerUpdateData = data
    _mbieClient = mbieClient
    _isIndividual = data.EntityType == IRConstants.ENTITY_TYPE_INDIVIDUAL
  }

  /**
   * Create account based on the customer update data.
   *
   * @param bundle - the bundle to use.  Does not commit, just adds the relevant data to the bundle.
   * @return - the account created
   */
  protected function createAccount(bundle : Bundle) : Account {
    _log.info("Creating account ${_customerUpdateData.AccNumber}")

    // Create account
    var newAccount = new Account(bundle)
    newAccount.ACCID_ACC = _customerUpdateData.AccNumber
    newAccount.EntityType_ACC = _customerUpdateData.EntityType
    newAccount.Source_ACC = Source_ACC.TC_CLIENT_REGISTRATION
    newAccount.PreferredCoverageCurrency = NZD // required to create account
    newAccount.PreferredSettlementCurrency = NZD // required to create account
    setAccountFields(newAccount)

    // Find / create account holder contact
    var contact : Contact
    if (_isIndividual) {
      newAccount.AccountOrgType = AccountOrgType.TC_INDIVIDUAL
      contact = ContactUtil.getContact(newAccount.ACCID_ACC, typekey.Contact.TC_PERSON, bundle) ?: new Person()
    } else {
      newAccount.AccountOrgType = AccountOrgType.TC_CORPORATION
      contact = ContactUtil.getContact(newAccount.ACCID_ACC, typekey.Contact.TC_COMPANY, bundle) ?: new Company()
    }
    contact.PreferredSettlementCurrency = NZD // Required to lookup account holder info on UI
    setContactFields(contact)

    // Create addresses
    removeDummyAddressIfExistsAsPrimary(contact)  // If the contact has a dummy address as primary, drop it.
    var primaryLocation = createAccountHolderAddresses(newAccount, contact)
    newAccount.PrimaryLocation = primaryLocation

    for (address in contact.AllAddresses) {
      checkAndUpdateAddressForGNA(address)
    }

    addAccountHolderToAccount(newAccount, contact)
    updateGNAAddresses(contact)

    _log.info("Finished creating account ${newAccount.ACCID_ACC}")
    return newAccount
  }

  private function addAccountHolderToAccount(account : Account, contact : Contact) {
    var accountContact = new AccountContact()
    accountContact.Contact = contact
    accountContact.addNewRole(typekey.AccountContactRole.TC_ACCOUNTHOLDER)
    account.addToAccountContacts(accountContact)
    // set the contact's external ID
    var externalID = ExternalIDUtil.mintNewExternalID("CONTACT_EXTERNALID")
    contact.ExternalID = externalID
    // set the account holder contact based on role
    account.updateAccountHolderContact()
  }

  protected function getAddressLinesForBICLookup() : String {
    // We can just use postal address, as if unknown, we've overwritten with the physical address
    return _customerUpdateData.PostalAddressLine1 + " " + _customerUpdateData.PostalAddressLine2
  }

  private function setAddressAccountFields(
      address : AccountLocation,
      addressLocationType : AddressLocationType_ACC,
      contact : Contact,
      account : Account) {
    address.AddressType = AddressType.TC_IRACC
    address.AddressLocType_ACC = addressLocationType
    address.Account = account
    // We just set this to 1.  It doesn't really do anything.
    address.LocationNum = 1
    account.addToAccountLocations(address)
    contact.addAddress(address)
  }

  private function createAccountHolderAddresses(account : Account, accountHolder : Contact) : AccountLocation {
    var accountLocationPostal = createAddress(account, accountHolder, _customerUpdateData.PostalAddressStatusIndicator, AddressLocationType_ACC.TC_POSTAL)
    var accountLocationPhysical = createAddress(account, accountHolder, _customerUpdateData.PhysicalAddressStatusIndicator, AddressLocationType_ACC.TC_PHYSICAL)

    var primaryLocation : AccountLocation

    if (accountLocationPostal.Present) {
      primaryLocation = accountLocationPostal.get()
    } else if (accountLocationPhysical.Present) {
      primaryLocation = accountLocationPhysical.get()
    } else {
      primaryLocation = createUnknownPostalAddress(account, accountHolder)
    }

    setContactAddressFlags(accountHolder, primaryLocation)
    setAddressFlags(primaryLocation)

    return primaryLocation
  }

  private function createAddress(
      account : Account,
      contact : Contact,
      statusIndicator : String,
      addrLocType : AddressLocationType_ACC) : Optional<AccountLocation> {

    var physicalAddressUnknown = isAddressUnknown(statusIndicator)

    if (physicalAddressUnknown) {
      return Optional.empty()

    } else {
      var address = new AccountLocation()
      setAddressAccountFields(address, addrLocType, contact, account)
      updateAddressFromIRFile(address, statusIndicator)
      setAddressPolicyType(address)
      return Optional.of(address)
    }
  }

  private function createUnknownPostalAddress(account : Account, contact : Contact) : AccountLocation {
    var address = new AccountLocation()
    address.AddressLine1 = GenericConstants.DUMMY_ADDRESS_FILLER
    address.City = GenericConstants.DUMMY_ADDRESS_FILLER
    address.PostalCode = GenericConstants.DUMMY_ADDRESS_FILLER
    address.Country = Country.TC_UNKNOWN_ACC
    address.UpdateTime_ACC = Date.CurrentDate
    address.ValidUntil = Date.CurrentDate.addDays(-1)
    setAddressAccountFields(address, AddressLocationType_ACC.TC_POSTAL, contact, account)
    updateAddressFromIRFile(address, _customerUpdateData.PostalAddressStatusIndicator)
    return address
  }

  /**
   * Replaces GNA Addresses with valid postal address, or valid physical address (in that order of preference)
   *
   * @param account
   */
  private function updateGNAAddresses(contact : Contact) {
    var nonGNAAddress = new GNAReplacementStrategy().findValidAddressForReplacingGNAAddress(contact, Optional.empty())

    if (nonGNAAddress.Present) {
      replaceGNAAddresses(contact, nonGNAAddress.get())
    }
  }

  private function replaceGNAAddresses(contact : Contact, accountLocation : Address) {
    if (contact.PrimaryAddress.IsGNA) {
      contact.makePrimaryAddress(accountLocation)
    }
    if (contact.CPCPXAddress_ACC != null && contact.CPCPXAddress_ACC.IsGNA) {
      contact.CPCPXAddress_ACC = accountLocation
    }
    if (contact.WPCAddress_ACC != null && contact.WPCAddress_ACC.IsGNA) {
      contact.WPCAddress_ACC = accountLocation
    }
    if (contact.WPSAddress_ACC != null && contact.WPSAddress_ACC.IsGNA) {
      contact.WPSAddress_ACC = accountLocation
    }

    updatePolicyFlagsForContactAddresses(contact)
  }

  private function updatePolicyFlagsForContactAddresses(contact : Contact) {
    var addresses = contact.getAllAddresses()

    for (address in addresses) {
      address.IsCPCPXAddress_ACC = (contact.CPCPXAddress_ACC == address)
      address.IsWPCAddress_ACC = (contact.WPCAddress_ACC == address)
      address.IsWPSAddress_ACC = (contact.WPSAddress_ACC == address)
    }
  }

  private function setAddressFlags(address : Address) {
    if (address == null) {
      return
    }
    if (_policyLineType.equals(typekey.PolicyLine.TC_INDCOPLINE)
        || _policyLineType.equals(PolicyLine.TC_INDCPXLINE)) {
      // For each policy type only set the policy address link if it's an IR address or not set yet.
      address.AddressPolicyType_ACC = AddressPolicyType_ACC.TC_CPCPX
      address.IsCPCPXAddress_ACC = true
    } else if (_policyLineType.equals(PolicyLine.TC_EMPWPCLINE)) {
      address.AddressPolicyType_ACC = AddressPolicyType_ACC.TC_WPC
      address.IsWPCAddress_ACC = true
    } else if (_policyLineType.equals(PolicyLine.TC_CWPSLINE)) {
      address.AddressPolicyType_ACC = AddressPolicyType_ACC.TC_WPS
      address.IsWPSAddress_ACC = true
    } else {
      throw new DisplayableException("Invalid policy line type: ${_policyLineType}}")
    }
  }

  private function setAddressPolicyType(address : Address) {
    if (address == null) {
      return
    }
    if (_policyLineType.equals(typekey.PolicyLine.TC_INDCOPLINE)
        || _policyLineType.equals(PolicyLine.TC_INDCPXLINE)) {
      // For each policy type only set the policy address link if it's an IR address or not set yet.
      address.AddressPolicyType_ACC = AddressPolicyType_ACC.TC_CPCPX
    } else if (_policyLineType.equals(PolicyLine.TC_EMPWPCLINE)) {
      address.AddressPolicyType_ACC = AddressPolicyType_ACC.TC_WPC
    } else if (_policyLineType.equals(PolicyLine.TC_CWPSLINE)) {
      address.AddressPolicyType_ACC = AddressPolicyType_ACC.TC_WPS
    } else {
      throw new DisplayableException("Invalid policy line type: ${_policyLineType}}")
    }
  }

  private function setContactAddressFlags(contact : Contact, address : Address) {
    if (address == null) {
      return
    }
    if (_policyLineType.equals(typekey.PolicyLine.TC_INDCOPLINE)
        || _policyLineType.equals(PolicyLine.TC_INDCPXLINE)) {
      // For each policy type only set the policy address link if it's an IR address or not set yet.
      if (contact.CPCPXAddress_ACC.AddressType == null ||
          contact.CPCPXAddress_ACC.AddressType == AddressType.TC_IRACC ||
          isInValidUnknownAddress(contact.CPCPXAddress_ACC)) {
        if (contact.CPCPXAddress_ACC != null) {
          contact.CPCPXAddress_ACC.clearAddressFlags()
        }
        contact.CPCPXAddress_ACC = address
      }
    } else if (_policyLineType.equals(PolicyLine.TC_EMPWPCLINE)) {
      if (contact.WPCAddress_ACC.AddressType == null ||
          contact.WPCAddress_ACC.AddressType == AddressType.TC_IRACC ||
          isInValidUnknownAddress(contact.WPCAddress_ACC)) {
        if (contact.WPCAddress_ACC != null) {
          contact.WPCAddress_ACC.clearAddressFlags()
        }
        contact.WPCAddress_ACC = address
      }
    } else if (_policyLineType.equals(PolicyLine.TC_CWPSLINE)) {
      if (contact.WPSAddress_ACC.AddressType == null ||
          contact.WPSAddress_ACC.AddressType == AddressType.TC_IRACC ||
          isInValidUnknownAddress(contact.WPSAddress_ACC)) {
        if (contact.WPSAddress_ACC != null) {
          contact.WPSAddress_ACC.clearAddressFlags()
        }

        contact.WPSAddress_ACC = address
      }
    } else {
      throw new DisplayableException("Invalid policy line type: ${_policyLineType}}")
    }
  }

  private function isInValidUnknownAddress(address : Address) : boolean {
    if (address.IsGNA or
        ((address.AddressLine1 == "Unknown" or address.AddressLine1.isEmpty()) and
            (address.City == "Unknown" or address.City.isEmpty()) and
            (address.PostalCode == "Unknown" or address.PostalCode.isEmpty())
        )) {
      return true
    }
    return false
  }

  /**
   * Update account based on the customer update data.
   *
   * @param bundle - the bundle to use.  Does not commit, just adds the relevant data to the bundle.
   * @return - the account created
   */
  protected function updateAccount(account : Account, bundle : Bundle) : Account {
    _log.info("Updating account ${account.ACCID_ACC}")

    // Check entity types are compatible.
    if ((_customerUpdateData.EntityType == IRConstants.ENTITY_TYPE_INDIVIDUAL && !(account.AccountHolderContact typeis Person)) ||
        (_customerUpdateData.EntityType != IRConstants.ENTITY_TYPE_INDIVIDUAL && !(account.AccountHolderContact typeis Company))) {
      throw new DisplayableException("Existing entity type not compatible with new. Existing: ${account.EntityType_ACC} New: ${_customerUpdateData.EntityType}")
    }

    account = bundle.add(account)

    // Check if the policy address already exists
    var policyAddressExists = policyAddressExists(account.AccountHolderContact.AllAddresses)

    if (!policyAddressExists) {
      createAccountHolderAddresses(account, account.AccountHolderContact)
    } else {
      updatePhysicalAddress(account)
      updatePostalAddress(account)
      // ChrisA 04/06/2020 JUNO-450 update the flags
      var addressToSet = getAddressForUpdate(account.AccountHolderContact)
      setContactAddressFlags(account.AccountHolderContact, addressToSet)
      setAddressFlags(addressToSet)
    }

    setContactFields(account.AccountHolderContact)
    setAccountFields(account)
    updatePolicyFlagsForContactAddresses(account.AccountHolderContact)

    for (address in account.AccountHolderContact.AllAddresses) {
      checkAndUpdateAddressForGNA(address)
    }

    updateGNAAddresses(account.AccountHolderContact)
    // set the account holder contact based on role
    account.updateAccountHolderContact()

    _log.info("Finished updating account ${account.ACCID_ACC}")
    return account
  }

  // ChrisA 04/06/2020 JUNO-450 update the flags
  private function getAddressForUpdate(accountHolderContact : Contact) : Address {

    var addressToUse = getAddress(_policyLineType, AddressLocationType_ACC.TC_POSTAL, accountHolderContact.AllAddresses)
    if (addressToUse == null or addressToUse.ValidUntil != null) {
      addressToUse = getAddress(_policyLineType, AddressLocationType_ACC.TC_PHYSICAL, accountHolderContact.AllAddresses)
    }
    return addressToUse
  }

  private function checkAndUpdateAddressForGNA(address : Address) {
    if (!address.IsGNA and (!address.AddressLine1.HasContent or address.AddressLine1 == "Unknown")) {
      address.ValidUntil = Date.CurrentDate.addDays(-1)
    }
  }

  private function updatePostalAddress(account : Account) {
    var postalAddress = getAddress(_policyLineType, AddressLocationType_ACC.TC_POSTAL, account.AccountHolderContact.AllAddresses)
    var irPostalAddressUnknown = isAddressUnknown(_customerUpdateData.PostalAddressStatusIndicator)

    var needsUpdate = addressNeedsUpdate(
        postalAddress,
        _customerUpdateData.PostalAddressStatusIndicator,
        _customerUpdateData.PostalAddressLine1,
        _customerUpdateData.PostalAddressChangeDate,
        irPostalAddressUnknown)

    if (!needsUpdate) {
      return
    }

    if (postalAddress == null) {
      if (!irPostalAddressUnknown) {
        // postal CAN BE NULL if migrated with a physical only
        createIRPostalAddress(account)
      }
    } else {
      if (irPostalAddressUnknown) {
        // Has gone GNA - update validUntil
        postalAddress.ValidUntil = Date.CurrentDate.addDays(-1)
      }
      updateAddressFromIRFile(postalAddress, _customerUpdateData.PostalAddressStatusIndicator)
    }
  }

  private function updatePhysicalAddress(account : Account) {
    var currentPhysicalAddress = getAddress(_policyLineType, AddressLocationType_ACC.TC_PHYSICAL, account.AccountHolderContact.AllAddresses)
    var irPhysicalAddressUnknown = isAddressUnknown(_customerUpdateData.PhysicalAddressStatusIndicator)

    var needsUpdate = addressNeedsUpdate(currentPhysicalAddress,
        _customerUpdateData.PhysicalAddressStatusIndicator,
        _customerUpdateData.PhysicalAddressLine1,
        _customerUpdateData.PhysicalAddressChangeDate,
        irPhysicalAddressUnknown)

    if (!needsUpdate) {
      return
    }

    if (currentPhysicalAddress == null) {
      createIRPhysicalAddress(account)

    } else {
      if (irPhysicalAddressUnknown) {
        // Has gone GNA - update validUntil
        currentPhysicalAddress.ValidUntil = Date.CurrentDate.addDays(-1)
      }
      updateAddressFromIRFile(currentPhysicalAddress, _customerUpdateData.PhysicalAddressStatusIndicator)
    }
  }

  private function createIRPostalAddress(account : Account) {
    var newAddress = new AccountLocation()
    newAddress.AddressLocType_ACC = AddressLocationType_ACC.TC_POSTAL
    updateAddressFromIRFile(newAddress, _customerUpdateData.PostalAddressStatusIndicator)
    setAddressAccountFields(newAddress, AddressLocationType_ACC.TC_POSTAL, account.AccountHolderContact, account)
    setAddressFlags(newAddress)
  }

  private function createIRPhysicalAddress(account : Account) {
    var newAddress = new AccountLocation()
    newAddress.AddressLocType_ACC = AddressLocationType_ACC.TC_PHYSICAL
    updateAddressFromIRFile(newAddress, _customerUpdateData.PhysicalAddressStatusIndicator)
    setAddressAccountFields(newAddress, AddressLocationType_ACC.TC_PHYSICAL, account.AccountHolderContact, account)
    setAddressPolicyType(newAddress)
    setAddressFlags(newAddress)
  }

  private function getAddress(policyLine : PolicyLine, addressLocationType : AddressLocationType_ACC, addresses : Address[]) : Address {
    var addressPolicyType = determineAddressTypeFromPolicyType(policyLine)
    return addresses.firstWhere(\address ->
        address.AddressPolicyType_ACC == addressPolicyType
            && address.AddressLocType_ACC == addressLocationType
            && address.AddressType == AddressType.TC_IRACC)
  }

  private function policyAddressExists(addresses : Address[]) : boolean {
    var addressType = determineAddressTypeFromPolicyType(_policyLineType)
    return addresses.hasMatch(\address -> address.AddressPolicyType_ACC == addressType)
  }

  private function determineAddressTypeFromPolicyType(policyType : PolicyLine) : AddressPolicyType_ACC {
    if (policyType == PolicyLine.TC_INDCOPLINE) {
      return AddressPolicyType_ACC.TC_CPCPX
    } else if (policyType == PolicyLine.TC_EMPWPCLINE) {
      return AddressPolicyType_ACC.TC_WPC
    } else if (policyType == PolicyLine.TC_CWPSLINE) {
      return AddressPolicyType_ACC.TC_WPS
    }
    return null
  }

  private function addressNeedsUpdate(
      address : Address,
      addressStatusIndicator : String,
      irAddressLine1 : String,
      irChangeDate : Date,
      irAddressUnknown : Boolean) : Boolean {

    if (GosuStringUtil.isBlank(addressStatusIndicator)) {
      return false

    } else if (address == null) {
      return !irAddressUnknown

    } else if (irChangeDate == null) {
      // if IR change date is not defined, then only update if the IR address line 1 is different
      if (address.AddressLine1 == null and irAddressLine1?.NotBlank) {
        return true
      } else {
        return address.AddressLine1 != null and not address.AddressLine1.equalsIgnoreCase(irAddressLine1)
      }

    } else if (address.UpdateTime_ACC == null) {
      return true

    } else {
      return address.UpdateTime_ACC.compareTo(irChangeDate) <= 0
    }
  }

  /**
   * Checks if a given contact has a dummy primary address and drop if exists.
   *
   * @param contact
   */
  private function removeDummyAddressIfExistsAsPrimary(contact : Contact) {
    var primaryAddress = contact.PrimaryAddress
    // not if no primary address
    if (primaryAddress == null) {
      return
    }

    if (isDummyAddress(primaryAddress)) {
      contact.removeAddress(primaryAddress)
    }
  }

  /**
   * Checks if the given address is a dummy address.
   *
   * @param address address to be checked
   * @return {@code true} if it's a dummy address.
   */
  private function isDummyAddress(address : Address) : boolean {
    return (address.AddressLine1 == GenericConstants.DUMMY_ADDRESS_FILLER &&
        address.City == GenericConstants.DUMMY_ADDRESS_FILLER &&
        address.PostalCode == GenericConstants.DUMMY_ADDRESS_FILLER &&
        address.Country == Country.TC_UNKNOWN_ACC)
  }

  private function setPersonFields(person : Person) {
    // DE1103 - Check first and last names aren't null/empty
    // TODO This is NOT the correct way to check for mandatory fields.  They should be made mandatory in CustomerUpdate.schema.
    if (_customerUpdateData.FirstNames == null or _customerUpdateData.FirstNames == "") {
      throw new DisplayableException("The first names are missing")
    }
    if (_customerUpdateData.LastName == null or _customerUpdateData.LastName == "") {
      throw new DisplayableException("The last name is missing")
    }

    var tokens = (_customerUpdateData.FirstNames.split(NAME_DELIMITER, NAME_TOKENS))

    var firstNameUTF8 = tokens[0]
    var middleNameUTF8 = tokens.Count > 1 ? tokens[1] : null
    var lastNameUTF8 = _customerUpdateData.LastName

    person.FirstName = firstNameUTF8?.flattenToAscii_ACC()
    person.MiddleName = middleNameUTF8?.flattenToAscii_ACC()
    person.LastName = lastNameUTF8?.flattenToAscii_ACC()

    person.LegalFirstName = null
    person.LegalMiddleName = null
    person.LegalLastName = null

    // Store original accented legal name from IRD
    if (person.FirstName != firstNameUTF8) {
      person.LegalFirstName = firstNameUTF8?.escaped_ACC()
    }
    if (person.MiddleName != middleNameUTF8) {
      person.LegalMiddleName = middleNameUTF8?.escaped_ACC()
    }
    if (person.LastName != lastNameUTF8) {
      person.LegalLastName = lastNameUTF8?.escaped_ACC()
    }

    if (validateDOB(_customerUpdateData.DateOfBirth)) {
      person.DateOfBirth = _customerUpdateData.DateOfBirth
    }

    // Remove all whitespaces before lookup
    var title = _customerUpdateData.Title
    person.Prefix = NamePrefix.get(title?.replaceAll("\\s", ""))
  }

  private function validateDOB(dob : Date) : boolean {
    var maxAge = ScriptParameters.IRCustomerUpdateMaxAge_ACC
    return (dob != null && dob.after(Date.CurrentDate.addYears(-maxAge)))
  }

  private function setCompanyFields(company : Company) {
    // DE1103 - Check employer name isn't null/empty
    // TODO This is NOT the correct way to check for mandatory fields.  They should be made mandatory in CustomerUpdate.schema.
    if (_customerUpdateData.EmployerName == null or _customerUpdateData.EmployerName == "") {
      throw new DisplayableException("The employer name is missing")
    }
    company.Name = _customerUpdateData.EmployerName?.flattenToAscii_ACC()
    company.LegalName = null
    if (company.Name != _customerUpdateData.EmployerName) {
      // Store original accented version of the trading name
      company.LegalName = _customerUpdateData.EmployerName?.escaped_ACC()
    }
  }

  private function updateAddressFromIRFile(address : Address, irAddressStatusFlag : String) {
    if (irAddressStatusFlag == null) {
      // Do nothing
      return
    }

    var type = address.AddressLocType_ACC == AddressLocationType_ACC.TC_POSTAL ? POSTAL_TYPE : PHYSICAL_TYPE

    var isOverseasAddress = irAddressStatusFlag.equalsIgnoreCase(IRConstants.ADDRESS_OVERSEAS_STATUS)
    var isAddressValid = irAddressStatusFlag.equalsIgnoreCase(IRConstants.VALID_ADDRESS_STATUS1) || irAddressStatusFlag.equalsIgnoreCase(IRConstants.VALID_ADDRESS_STATUS2)

    // Do nothing for certain statuses - for invalid status we want to keep going and store just address lines 1 & 2
    if (!isAddressValid && !isOverseasAddress) {
      return
    }

    clearAddressFields(address)

    // We need to set this in the event that the address changes from overseas to NZ
    address.Country = Country.TC_NZ

    var irAddressLine1 = _customerUpdateData[type + ADDRESS_LINE1] as String
    var irAddressLine2 = _customerUpdateData[type + ADDRESS_LINE2] as String

    var doLookup = isAddressValid && !isOverseasAddress && ScriptParameters.IRAddressLookupEnabled_ACC

    var addressUpdatedFromValidationAPI = false

    if (doLookup) {
      addressUpdatedFromValidationAPI = updateAddressWithValidationAPI(irAddressLine1, irAddressLine2, address)
    }

    // If the address hasn't been set yet, we use address lines 1 & 2
    if (!addressUpdatedFromValidationAPI) {
      // we use the fields unchanged
      // Use reflection to set the address fields so we don't have to repeat code for each address type.
      address.AddressLine1 = irAddressLine1
      address.AddressLine2 = irAddressLine2

      if (isOverseasAddress) {
        address.PostalCode = null
        address.Country = Country.TC_UNKNOWN_ACC
      } else {
        address.PostalCode = _customerUpdateData[type + POSTAL_CODE] as String
      }
    }

    var irChangeDate = _customerUpdateData[type + CHANGE_DATE] as Date
    if (irChangeDate != null) {
      address.UpdateTime_ACC = irChangeDate
    } else {
      address.UpdateTime_ACC = DateUtil.currentDate()
    }

    address.ValidUntil = null
  }

  private function updateAddressWithValidationAPI(irAddressLine1 : String, irAddressLine2 : String, address : Address) : Boolean {
    var addressSearchQuery = irAddressLine1 + " " + irAddressLine2

    // Check whether we already used this lookup - if so skip since we already have the result
    if (!addressSearchQuery.equalsIgnoreCase(_previousAddressSearchQuery)) {
      try {
        // Use the AddressFinder address verification - which gives us one match or none (not multiple)
        _addressMetadata = new AddressValidationAPI_ACC().getAddressMetadata_ACC(addressSearchQuery)
        // we got a result, so save the lookup & result
        _previousAddressSearchQuery = addressSearchQuery
      } catch (e : Exception) {
        throw new AddressValidationAPIException(e.Message)
      }
    }

    if (_addressMetadata != null && _addressMetadata.Matched) {
      address.AddressLine1 = _addressMetadata.AddressLine1
      address.AddressLine2 = _addressMetadata.AddressLine2
      address.AddressLine3 = _addressMetadata.AddressLine3
      address.City = _addressMetadata.AddressLineCity
      address.PostalCode = _addressMetadata.Postcode
      return true

    } else {
      return false
    }
  }

  /**
   * Clear IR related address fields.
   * The country is not cleared.
   *
   * @param address - address to clear
   */
  private function clearAddressFields(address : Address) {
    address.AddressLine1 = null
    address.AddressLine1 = null
    address.AddressLine3 = null
    address.City = null
    address.PostalCode = null
  }

  private function setContactFields(contact : Contact) {

    if (_isIndividual) {
      setPersonFields(contact as Person)
    } else {
      setCompanyFields(contact as Company)
    }

    _customerUpdateData.HomePhone = stripNonDigits(_customerUpdateData.HomePhone)
    _customerUpdateData.BusinessPhone = stripNonDigits(_customerUpdateData.BusinessPhone)
    _customerUpdateData.CellPhone = stripNonDigits(_customerUpdateData.CellPhone)

    _customerUpdateData.HomePhone = fixInvalidNumberEdgeCase(_customerUpdateData.HomePhone)
    _customerUpdateData.BusinessPhone = fixInvalidNumberEdgeCase(_customerUpdateData.BusinessPhone)
    _customerUpdateData.CellPhone = fixInvalidNumberEdgeCase(_customerUpdateData.CellPhone)

    contact.ACCID_ACC = _customerUpdateData.AccNumber

    if (isPhoneValid(_customerUpdateData.HomePhone)) {
      contact.HomePhone = _customerUpdateData.HomePhone
    } else {
      if (GosuStringUtil.isNotEmpty(_customerUpdateData.HomePhone))
        _log.info("Invalid HomePhone for contact ${contact.ACCID_ACC}")
    }

    if (isPhoneValid(_customerUpdateData.BusinessPhone)) {
      contact.WorkPhone = _customerUpdateData.BusinessPhone
    } else {
      if (GosuStringUtil.isNotEmpty(_customerUpdateData.BusinessPhone))
        _log.info("Invalid BusinessPhone for contact ${contact.ACCID_ACC}")
    }

    if (isPhoneValid(_customerUpdateData.CellPhone)) {
      updateIRPhoneStatus(contact)
      contact.IRCellPhone_ACC = _customerUpdateData.CellPhone
    } else {
      if (GosuStringUtil.isNotEmpty(_customerUpdateData.CellPhone))
        _log.info("Invalid IR Mobile Number for contact ${contact.ACCID_ACC}")
    }

    if (GosuStringUtil.isEmpty(_customerUpdateData.Email)) {
      updateIREmailStatus(contact)
      contact.IREmailAddress = null
    } else {
      if (EmailValidator.getInstance().isValid(_customerUpdateData.Email)) {
        updateIREmailStatus(contact)
        contact.IREmailAddress = _customerUpdateData.Email
      } else {
        _log.info("Invalid Email for contact ${contact.ACCID_ACC}")
      }
    }
  }

  private function updateIRPhoneStatus(contact : Contact) {
    if (!Objects.equals(contact.IRCellPhone_ACC, _customerUpdateData.CellPhone)) {
      contact.IRPhoneVerifiedStatus_ACC = null
      contact.irPhoneValidUntil()
    }
  }

  private function updateIREmailStatus(contact : Contact) {
    if (!Objects.equals(contact.IREmailAddress, _customerUpdateData.Email)) {
      contact.IREmailVerifiedStatus_ACC = null
      contact.irEmailValidUntil()
    }
  }

  /**
   * This tries to match the conditions in PhoneValidator.gs
   *
   * @param phone
   * @return
   */
  private function isPhoneValid(phone : String) : Boolean {
    if (phone == null) {
      return false

    } else if (phone.length < 8 or phone.length > 15) {
      return false

    } else {
      return PhoneUtil.isViableNumber(phone)
    }
  }

  private function stripNonDigits(s : String) : String {
    // Remove everything except digits and leading + e.g. +123456
    var newStr = s?.trim()?.replaceAll("(?!^\\+)\\D", "")
    return newStr?.equals("+") ? null : newStr
  }

  /**
   * Workaround for defect in OOTB GW phone number library
   * Phone number starting with 00383 and null country code will crash phone display formatter
   * when config.xml default phone country is NZ
   * <p>
   * Replaces prefix 00383 with 0383
   *
   * @param phoneNumber
   * @return
   */
  private function fixInvalidNumberEdgeCase(phoneNumber : String) : String {
    if (phoneNumber == null) {
      return null
    } else if (phoneNumber.startsWith("00383")) {
      return phoneNumber.substring(1, phoneNumber.length)
    } else {
      return phoneNumber
    }
  }

  private function setAccountFields(account : Account) {
    // The first 9 digits of the IrdReferenceNumber is the IRD number.
    // The remaining 4 digit value is a location value which we ignore.
    account.IRDNumber_ACC = GosuStringUtil.left(_customerUpdateData.IrdReferenceNumber, IRD_NUMBER_LENGTH)
    account.EntityClass_ACC = _customerUpdateData.EntityClass

    account.TradingName_ACC = _customerUpdateData.TradeName?.flattenToAscii_ACC()
    account.LegalTradingName = null

    if (account.TradingName_ACC != _customerUpdateData.TradeName) {
      // Store original accented version of the trading name
      account.LegalTradingName = _customerUpdateData.TradeName?.escaped_ACC()
    }

    validateAndSetNZBNFields(account)

    setAccountStatus(account)
  }

  private function validateAndSetNZBNFields(account : Account) {
    account.IRNZBN_ACC = _customerUpdateData.NZBN

    if (ConfigurationProperty.NZBN_VALIDATIONAPI_ENABLED.PropertyValue.toBoolean()
        and ScriptParameters.IRNZBNValidationEnabled_ACC) {
      if (_mbieClient.validateNZBN(_customerUpdateData.NZBN)) {
        account.NZBN_ACC = _customerUpdateData.NZBN
      }
    } else {
      _log.debug("NZBN Validation API is disabled via script parameter and/or configuration.properties")
    }
  }

  private function setAccountStatus(account : Account) {
    // Check if we need to set the status to something else
    // Note that TaxTypeStartDate can be equal to TaxTypeEndDate hence why we use compareTo for that check.
    if (_customerUpdateData.TaxTypeEndDate != null && _customerUpdateData.TaxTypeEndDate.before(Date.CurrentDate) &&
        _customerUpdateData.TaxTypeStartDate?.compareTo(_customerUpdateData.TaxTypeEndDate) <= 0) {
      // Person
      if (_isIndividual) {
        if (_customerUpdateData.TaxTypeEndReason?.equalsIgnoreCase(IRConstants.STATUS_BANKRUPT)) {
          account.setAccountStatusAndEndDate(StatusOfAccount_ACC.TC_BANKRUPT, null, _customerUpdateData.TaxTypeEndDate)
        } else if (_customerUpdateData.TaxTypeEndReason?.equalsIgnoreCase(IRConstants.STATUS_DECEASED)) {
          account.setAccountStatusAndEndDate(StatusOfAccount_ACC.TC_DECEASED, null, _customerUpdateData.TaxTypeEndDate)
        }
        // If all of the other validations have fallen through, we have one last check on the name
        // Change in requirements - the enddate must be valid.
        // Even though the one example we have of live data with this case DOES NOT HAVE A VALID END DATE
        if (_customerUpdateData.FirstNames.toLowerCase().contains(NAME_DECEASED) ||
            _customerUpdateData.LastName.toLowerCase().contains(NAME_DECEASED)) {
          account.setAccountStatusAndEndDate(StatusOfAccount_ACC.TC_DECEASED, null, _customerUpdateData.TaxTypeEndDate)
        }
      }
      // Company
      else if (_customerUpdateData.TaxTypeEndReason?.equalsIgnoreCase(IRConstants.STATUS_REMOVED)) {
        account.setAccountStatusAndEndDate(StatusOfAccount_ACC.TC_REMOVED, null, _customerUpdateData.TaxTypeEndDate)
      }
    }
  }

  private function setAccountStatusAndEndDate(account : Account, accountStatus : StatusOfAccount_ACC, endDate : Date) {
    account.StatusOfAccount_ACC = accountStatus
    account.TaxTypeEndDate_ACC = endDate
  }

  private function isAddressUnknown(status : String) : boolean {
    return GosuStringUtil.isBlank(status) ||
        status.equals(IRConstants.ADDRESS_UNKNOWN_STATUS) ||
        status.equals(IRConstants.ADDRESS_INVALID_STATUS)
  }
}
