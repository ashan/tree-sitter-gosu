package nz.co.acc.edge.capabilities.accountcontact

uses edge.PlatformSupport.Logger
uses edge.capabilities.policycommon.accountcontact.DefaultAccountContactPlugin
uses edge.di.annotations.ForAllNodes
uses entity.AccountContact
uses entity.Address
uses entity.Contact
uses gw.api.util.PhoneUtil
uses gw.api.util.StringUtil
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.util.GosuStringUtil
uses nz.co.acc.accountcontact.AccountContactUtil_ACC
uses nz.co.acc.accountcontact.error.ContactMultipleMatchesException
uses nz.co.acc.accountcontact.error.ContactNotFoundException
uses nz.co.acc.accountcontact.relationship.CompanyContactRelationship
uses nz.co.acc.accountcontact.relationship.PersonContactRelationship
uses nz.co.acc.activity.ActivityCodes
uses nz.co.acc.edge.capabilities.accountcontact.dto.AccountContactDTO_ACC
uses nz.co.acc.edge.capabilities.accountcontact.dto.CompanyContactRelationshipDTO_ACC
uses nz.co.acc.edge.capabilities.accountcontact.dto.PersonContactRelationshipDTO_ACC
uses nz.co.acc.edge.capabilities.accountcontact.dto.PhoneDTO_ACC
uses nz.co.acc.edge.capabilities.address.IAddressPlugin_ACC
uses nz.co.acc.edge.capabilities.address.dto.AddressDTO_ACC
uses nz.co.acc.edge.capabilities.helpers.AccountUtil_ACC
uses nz.co.acc.edge.time.LocalDateUtil_ACC
uses nz.co.acc.history.CustomHistoryHelper_ACC
uses nz.co.acc.plm.util.AssignableQueueUtils
uses org.apache.commons.collections4.CollectionUtils
uses nz.co.acc.util.StringUtil_ACC
uses typekey.AccountContactRole

class AccountContactPlugin_ACC extends DefaultAccountContactPlugin implements IAccountContactPlugin_ACC {

  private static final var _log = StructuredLogger.INTEGRATION.withClass(AccountContactPlugin_ACC)

  private var _addressPlugin : IAddressPlugin_ACC
  private final var _portalActivityQueue = AssignableQueueUtils.getQueueForPortalActivity()


  @ForAllNodes
  construct(addressPlugin : IAddressPlugin_ACC) {
    super(addressPlugin)
    this._addressPlugin = addressPlugin
  }

  function setContactDetails(contact : Contact, dto : AccountContactDTO_ACC) {
    contact.Name = dto.ContactName
    contact.NameKanji = dto.ContactNameKanji
    contact.PrimaryPhone = dto.PrimaryPhoneType
    contact.CorrespondencePreference_ACC = dto.CorrespondencePreference

    if (dto.hasV2PhoneFields) {

      contact.HomePhoneCountry = PhoneCountryCode.getTypeKey(dto.HomeNumberV2.CountryISOCode)
      contact.HomePhone = StringUtil_ACC.filterNonDigits(dto.HomeNumberV2.PhoneNumber)
      contact.HomePhoneExtension = dto.HomeNumberV2.ExtensionCode

      contact.WorkPhoneCountry = PhoneCountryCode.getTypeKey(dto.WorkNumberV2.CountryISOCode)
      contact.WorkPhone = StringUtil_ACC.filterNonDigits(dto.WorkNumberV2.PhoneNumber)
      contact.WorkPhoneExtension = dto.WorkNumberV2.ExtensionCode

      if (contact typeis Person) {
        contact.CellPhoneCountry = PhoneCountryCode.getTypeKey(dto.MobileNumberV2.CountryISOCode)
        contact.CellPhone = StringUtil_ACC.filterNonDigits(dto.MobileNumberV2.PhoneNumber)

      } else if (contact typeis Company) {
        contact.CellPhoneCountry_ACC = PhoneCountryCode.getTypeKey(dto.MobileNumberV2.CountryISOCode)
        contact.CellPhone_ACC = StringUtil_ACC.filterNonDigits(dto.MobileNumberV2.PhoneNumber)
      }
    } else {

      contact.HomePhone = StringUtil_ACC.filterNonDigits(dto.HomeNumber)
      contact.WorkPhone = StringUtil_ACC.filterNonDigits(dto.WorkNumber)
      if (contact typeis Person) {
        contact.CellPhone = StringUtil_ACC.filterNonDigits(dto.MobileNumber)
      } else if (contact typeis Company) {
        contact.CellPhone_ACC = StringUtil_ACC.filterNonDigits(dto.MobileNumber)
      }
    }

    contact.EmailAddress1 = dto.EmailAddress1

    var currentAddressValueAsDTO  = _addressPlugin.toAddressDTO_ACC(contact.PrimaryAddress, true)

    if(not currentAddressValueAsDTO.equals(dto.PrimaryAddress)){
      updateContactAddresses(contact, dto)
    }

    if (contact.Subtype == typekey.Contact.TC_PERSON) {
      updatePersonData(contact as Person, dto)
    }
    contact.ClaimsEmailAddress_ACC = dto.ClaimsEmailAddress
    contact.ClaimsEmailVerifiedDate_ACC = dto.ClaimsEmailVerifiedDate
  }


  private function updateContactAddresses(contact : Contact, dto : AccountContactDTO_ACC) : void {
    if (dto.PrimaryAddress != null) {
      _log.debug("primary address of DTO is not null")
      var contactAddressesPreferred = contact.AllAddresses.where(\elt -> elt.AddressType == AddressType.TC_PREFERREDACC)
      if (contactAddressesPreferred.length == 0) {
        //if contact has no preffered addresses
        _log.debug("Contact: ${contact.ID} has no preffered addresses")
        //create primary address, move all flags to new address.
        var addressToUpdate = new Address()
        _addressPlugin.fillAddressEntity_ACC(addressToUpdate, dto.PrimaryAddress)
        pointAllFlagsToNewAddressAndSetPreferred(contact, addressToUpdate)
      }
      else if (contactAddressesPreferred.length == 1 and dto.PrimaryAddress.AddressType != AddressType.TC_PREFERREDACC) {
        //if contact has 1 address which is the preferred AddressType and mya4b is trying to update an address with different type.
        //Update that preferred address, move all flags to primary address
        _log.debug("Contact: ${contact.ID} only has one prefered address")
        var addressToUpdate = contactAddressesPreferred.first()
        _addressPlugin.updateFromDTO(addressToUpdate, dto.PrimaryAddress)
        pointAllFlagsToNewAddressAndSetPreferred(contact, addressToUpdate)
      }
      else if (contactAddressesPreferred.length > 1 and dto.PrimaryAddress.AddressType != AddressType.TC_PREFERREDACC) {
        //if contact has more than 1 address which is the preferred AddressType and mya4b is trying to update an address with different type.
        _log.debug("Contact: ${contact.ID} has more than one address which is pref")
        var addressToUpdate = contactAddressesPreferred.firstWhere(\elt -> elt.ValidUntil == null and elt.IsGNA == false)
        if (addressToUpdate == null) {
          //If the preferred address are all GNA, pick any preferred address to update
          addressToUpdate = contactAddressesPreferred.first()
        }
        _addressPlugin.updateFromDTO(addressToUpdate, dto.PrimaryAddress)
        pointAllFlagsToNewAddressAndSetPreferred(contact, addressToUpdate)
      } else {
        //in all other cases we want to update the address as normal.
        _log.debug("Contact: ${contact.ID} has more than one address which is pref")
        _addressPlugin.updateFromDTO(contact.PrimaryAddress, dto.PrimaryAddress)
        //if contact is updated, address shouldn't be invalid anymore. Also add address location type postal to any address update from mya4b
        pointAllFlagsToNewAddressAndSetPreferred(contact, contact.PrimaryAddress)
        dto.PrimaryAddress.IsInvalid = Boolean.FALSE
      }
    }



  }


  private function pointAllFlagsToNewAddressAndSetPreferred(contact : Contact, addressToUpdate : Address) : void {
    addressToUpdate.AddressType = AddressType.TC_PREFERREDACC
    addressToUpdate.AddressLocType_ACC = AddressLocationType_ACC.TC_POSTAL
    contact.makePrimaryAddress(addressToUpdate)
    contact.setCPCPXAddress_ACC(addressToUpdate)
    contact.setWPSAddress_ACC(addressToUpdate)
    contact.setWPCAddress_ACC(addressToUpdate)
  }

  override function updateContact(accountContact : AccountContact, dto : AccountContactDTO_ACC, reason : String) : AccountContactDTO_ACC {
    var contact = accountContact.Contact

    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      var account = bundle.add(accountContact.Account)
      var currentPrimary = account.PrimaryAccountContactID_ACC
      if(dto.IsPrimary) {
        account.PrimaryAccountContactID_ACC = accountContact.ID.Value
      } else {
        if(accountContact.Contact == accountContact.Account.PrimaryContact_ACC) {
          var accountHolderAccountContact = accountContact.Account.AccountContacts
              .firstWhere(\elt -> elt.Contact == accountContact.Account.AccountHolderContact)
          account.PrimaryAccountContactID_ACC = accountHolderAccountContact.ID.Value
        }
      }

      var newPrimary = account.PrimaryAccountContactID_ACC

      contact = bundle.add(contact)
      accountContact = bundle.add(accountContact)
      setContactDetails(contact, dto)

    }, User.util.CurrentUser)

    accountContact.refresh()

    dto = toAccountContactDTO_ACC(accountContact)

    dto.DisplayName = contact.DisplayName
    return dto
  }

  private function updatePersonData(person : Person, dto : AccountContactDTO_ACC) {
    person.FirstName = dto.FirstName
    person.LastName = dto.LastName
    person.MiddleName = dto.MiddleName

    if (dto.hasV2PhoneFields) {
      //due to rule added to the PersonDTO we need to avoid setting the primary phone type to home if homephone is not set
      if (dto.HomeNumberV2.PhoneNumber.NotBlank or dto.PrimaryPhoneType != PrimaryPhoneType.TC_HOME) {
        person.PrimaryPhone = dto.PrimaryPhoneType
      }

      person.HomePhoneCountry = PhoneCountryCode.getTypeKey(dto.HomeNumberV2.CountryISOCode)
      person.HomePhone = StringUtil_ACC.filterNonDigits(dto.HomeNumberV2.PhoneNumber)
      person.HomePhoneExtension = dto.HomeNumberV2.ExtensionCode

      person.WorkPhoneCountry = PhoneCountryCode.getTypeKey(dto.WorkNumberV2.CountryISOCode)
      person.WorkPhone = StringUtil_ACC.filterNonDigits(dto.WorkNumberV2.PhoneNumber)
      person.WorkPhoneExtension = dto.WorkNumberV2.ExtensionCode

      person.CellPhoneCountry = PhoneCountryCode.getTypeKey(dto.MobileNumberV2.CountryISOCode)
      person.CellPhone = StringUtil_ACC.filterNonDigits(dto.MobileNumberV2.PhoneNumber)
    } else {
      //due to rule added to the PersonDTO we need to avoid setting the primary phone type to home if homephone is not set
      if (dto.HomeNumber.NotBlank or dto.PrimaryPhoneType != PrimaryPhoneType.TC_HOME) {
        person.PrimaryPhone = dto.PrimaryPhoneType
      }

      person.HomePhone = StringUtil_ACC.filterNonDigits(dto.HomeNumber)
      person.WorkPhone = StringUtil_ACC.filterNonDigits(dto.WorkNumber)
      person.CellPhone = StringUtil_ACC.filterNonDigits(dto.MobileNumber)
    }

    person.MaritalStatus = dto.MaritalStatus
    person.Prefix = dto.Prefix
    person.Suffix = dto.Suffix

    if (dto.DateOfBirth != null) {
      person.DateOfBirth = LocalDateUtil_ACC.toMidnightDate(dto.DateOfBirth)
    }

    person.FirstNameKanji = dto.FirstNameKanji
    person.Particle = dto.Particle
    person.LastNameKanji = dto.LastNameKanji
  }

  override function toAccountContactDTO_ACC(contact : AccountContact) : AccountContactDTO_ACC {
    final var dto = new AccountContactDTO_ACC()
    fillContact(contact, dto)
    if (contact.Contact.Subtype == typekey.Contact.TC_PERSON) {
      fillPersonFields(contact.Contact as Person, dto)
    }
    return dto
  }

  private function toPhoneDTO_ACC(countryCode : PhoneCountryCode, phoneNumber : String, extension : String) : PhoneDTO_ACC {
    var phoneDTO = new PhoneDTO_ACC()

    if (countryCode != null) {
      var countryCodeString = "" + PhoneUtil.getCountryCodeForRegion(countryCode)
      phoneDTO.CountryISOCode = countryCode.Code
      phoneDTO.CountryCode = countryCodeString
    }

    phoneDTO.PhoneNumber = formatPhoneNumber(phoneNumber)
    phoneDTO.ExtensionCode = extension

    return phoneDTO
  }

  private function fillContact(accountContact : AccountContact, dto : AccountContactDTO_ACC) {
    final var contact = accountContact.Contact

    dto.PublicID = accountContact.PublicID
    dto.Subtype = accountContact.Contact.Subtype.Code
    dto.DisplayName = accountContact.DisplayName
    dto.ContactName = accountContact.Contact.Name

    dto.EmailAddress1 = contact.EmailAddress1
    dto.EmailVerifiedDate = contact.EmailVerifiedDate_ACC
    dto.CorrespondencePreference = contact.CorrespondencePreference_ACC
    dto.ContactNameKanji = contact.NameKanji
    dto.PrimaryPhoneType = contact.PrimaryPhone

    dto.HomeNumberV2 = toPhoneDTO_ACC(contact.HomePhoneCountry, contact.HomePhone, contact.HomePhoneExtension)
    dto.WorkNumberV2 = toPhoneDTO_ACC(contact.WorkPhoneCountry, contact.WorkPhone, contact.WorkPhoneExtension)
    dto.HomeNumber = formatPhoneNumber(contact.HomePhone)
    dto.WorkNumber = formatPhoneNumber(contact.WorkPhone)
    dto.ClaimsEmailAddress = contact.ClaimsEmailAddress_ACC
    dto.ClaimsEmailVerifiedDate = contact.ClaimsEmailVerifiedDate_ACC

    if (contact typeis Person) {
      dto.MobileNumberV2 = toPhoneDTO_ACC(contact.CellPhoneCountry, contact.CellPhone, :extension = null)
      dto.MobileNumber = formatPhoneNumber(contact.CellPhoneValue)

    } else if (contact typeis Company) {
      dto.MobileNumberV2 = toPhoneDTO_ACC(contact.CellPhoneCountry_ACC, contact.CellPhone_ACC, :extension = null)
      dto.MobileNumber = formatPhoneNumber(contact.CellPhone_ACC)
    }

    dto.AccountHolder = AccountUtil_ACC.isAccountHolder(accountContact)
    dto.IsPrimary = accountContact.Primary_ACC
    dto.IREmailAddress = accountContact.Contact.IREmailVerified_ACC
    dto.IRCellPhone = accountContact.Contact.IRCelPhoneVerified_ACC
    dto.Roles = accountContact*.Roles*.Subtype*.Code
    dto.ContactType = contact.Subtype.Code
    dto.ACCID = contact.ACCID_ACC

    if (accountContact.Contact.PrimaryAddress != null) {
      dto.PrimaryAddress = _addressPlugin.toAddressDTO_ACC(contact.PrimaryAddress, :isPrimaryAddress = true)
      if (dto.PrimaryAddress.AddressType == null) {
        if (accountContact.Contact.Subtype == typekey.Contact.TC_PERSON) {
          dto.PrimaryAddress.AddressType = AddressType.TC_HOME
        } else if (accountContact.Contact.Subtype == typekey.Contact.TC_COMPANY) {
          dto.PrimaryAddress.AddressType = AddressType.TC_BUSINESS
        }
      }
    }

    var primaryAddressPublicID = contact.PrimaryAddress?.PublicID

    dto.Addresses = contact.AllAddresses
        .orderBy(\elt -> elt.PublicID)
        .map(\address -> {
          var isPrimaryAddress = address.PublicID == primaryAddressPublicID
          return _addressPlugin.toAddressDTO_ACC(address, isPrimaryAddress)
        })
  }

  private function formatPhoneNumber(phoneNumber : String) : String {
    return phoneNumber.HasContent ? PhoneUtil.format(phoneNumber, gw.api.util.PhoneUtil.UserDefaultPhoneCountry) : null
  }

  private function fillPersonFields(aPerson : Person, dto : AccountContactDTO_ACC) {
    dto.FirstName = aPerson.FirstName
    dto.LastName = aPerson.LastName
    dto.MiddleName = aPerson.MiddleName
    dto.Prefix = aPerson.Prefix
    dto.Suffix = aPerson.Suffix
    dto.Particle = aPerson.Particle
    dto.FirstNameKanji = aPerson.FirstNameKanji
    dto.LastNameKanji = aPerson.LastNameKanji
    dto.MobileNumberV2 = toPhoneDTO_ACC(aPerson.CellPhoneCountry, aPerson.CellPhone, :extension = null)
    dto.MobileNumber = aPerson.CellPhoneValue
    dto.MaritalStatus = aPerson.MaritalStatus
    dto.DateOfBirth = LocalDateUtil_ACC.toDTO(aPerson.DateOfBirth)

    //due to rule added to the PersonDTO we need to avoid setting the primary phone type to home if homephone is not set
    if (aPerson.HomePhone.NotBlank || aPerson.PrimaryPhone != PrimaryPhoneType.TC_HOME) {
      dto.PrimaryPhoneType = aPerson.PrimaryPhone
    }
  }

  override public function createCompanyContactRelationship(account : Account, dto : CompanyContactRelationshipDTO_ACC) : String {
    checkRequiredFields(dto, false)
    var relationship = toCompanyContactRelationship(account.ACCID_ACC, dto)
    try {
      AccountContactUtil_ACC.createCompanyContactRelationship(relationship)

    } catch (e : ContactNotFoundException) {
      createActivityForCompany(account, dto, :delete = false)
      return "Contact not found. Raised activity."

    } catch (e : ContactMultipleMatchesException) {
      createActivityForCompany(account, dto, :delete = false)
      return "Contact name has multiple matches. Raised activity."
    }
    return null
  }

  override public function deleteCompanyContactRelationship(account : Account, dto : CompanyContactRelationshipDTO_ACC) : String {
    checkRequiredFields(dto, true)
    var relationship = toCompanyContactRelationship(account.ACCID_ACC, dto)
    try {
      AccountContactUtil_ACC.deleteCompanyContactRelationship(relationship)

    } catch (e : ContactNotFoundException) {
      createActivityForCompany(account, dto, :delete = true)
      return "Contact not found. Raised activity."

    } catch (e : ContactMultipleMatchesException) {
      createActivityForCompany(account, dto, :delete = false)
      return "Contact name has multiple matches. Raised activity."
    }
    return null
  }

  override public function createPersonContactRelationship(account : Account, dto : PersonContactRelationshipDTO_ACC) : String {
    checkRequiredFields(dto, false)
    var relationship = toPersonContactRelationship(account.ACCID_ACC, dto)
    try {
      AccountContactUtil_ACC.createPersonContactRelationship(relationship)

    } catch (e : ContactNotFoundException) {
      createActivityForPerson(account, dto, :delete = false)
      return "Contact not found. Raised activity."

    } catch (e : ContactMultipleMatchesException) {
      createActivityForPerson(account, dto, :delete = false)
      return "Contact name has multiple matches. Raised activity."
    }
    return null
  }

  override public function deletePersonContactRelationship(account : Account, dto : PersonContactRelationshipDTO_ACC) : String {
    checkRequiredFields(dto, true)
    var relationship = toPersonContactRelationship(account.ACCID_ACC, dto)
    try {
      AccountContactUtil_ACC.deletePersonContactRelationship(relationship)

    } catch (e : ContactNotFoundException) {
      createActivityForPerson(account, dto, :delete = true)
      return "Contact not found. Raised activity."

    } catch (e : ContactMultipleMatchesException) {
      createActivityForPerson(account, dto, :delete = false)
      return "Contact name has multiple matches. Raised activity."
    }
    return null
  }

  private function toCompanyContactRelationship(accountACCID : String, dto : CompanyContactRelationshipDTO_ACC) : CompanyContactRelationship {
    var relationship = new CompanyContactRelationship()
    relationship.AccountACCNumber = accountACCID
    relationship.ContactACCNumber = dto.ContactACCNumber
    relationship.ContactName = dto.ContactName
    relationship.AccountRole = dto.AccountRole
    return relationship
  }

  private function toPersonContactRelationship(accountACCID : String, dto : PersonContactRelationshipDTO_ACC) : PersonContactRelationship {
    var relationship = new PersonContactRelationship()
    relationship.AccountACCNumber = accountACCID
    relationship.ContactACCNumber = dto.ContactACCNumber
    relationship.ContactFirstName = dto.ContactFirstName
    relationship.ContactMiddleName = dto.ContactMiddleName
    relationship.ContactLastName = dto.ContactLastName
    relationship.ContactDateOfBirth = dto.ContactDateOfBirth
    relationship.AccountRole = dto.AccountRole
    relationship.EmployeeRelation = dto.EmployeeRelation
    relationship.ThirdPartyRelation = dto.ThirdPartyRelation
    return relationship
  }

  private function createActivityForPerson(account : Account, dto : PersonContactRelationshipDTO_ACC, delete : Boolean) {
    _log.info("Creating activity for account ${account.ACCID_ACC} deleteRelationship=${delete}")
    var subject = createActivitySubject(account.ACCID_ACC, dto.AccountRole, delete)
    var description = createActivityDescription(dto, delete)
    createActivity(account, subject, description, delete)
  }

  private function createActivityForCompany(account : Account, dto : CompanyContactRelationshipDTO_ACC, delete : Boolean) {
    _log.info("Creating activity for account ${account.ACCID_ACC} deleteRelationship=${delete}")
    var subject = createActivitySubject(account.ACCID_ACC, dto.AccountRole, delete)
    var description = createActivityDescription(dto, delete)
    createActivity(account, subject, description, delete)
  }

  private function createActivity(account : Account, subject : String, description : String, delete : Boolean) {
    var pattern = ActivityPattern.finder.getActivityPatternByCode(ActivityCodes.MyACCForBusinessRequest)
    if (pattern == null) {
      throw new RuntimeException("Could not find activity pattern: ${ActivityCodes.MyACCForBusinessRequest}.")
    }
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      var activity = pattern.createAccountActivity(
          bundle, pattern, account, subject, description,
          null, null, null, null, null)
      activity = bundle.add(activity)
      activity.assignActivityToQueue(_portalActivityQueue, _portalActivityQueue.Group)
    }, "sys")
  }

  private function createActivitySubject(accountACCID : String, accountRole : AccountContactRole, delete : Boolean) : String {
    if (delete) {
      return "Delete relationship ${accountRole} for ${accountACCID}"
    } else {
      return "Create relationship ${accountRole} for ${accountACCID}"
    }
  }

  private function createActivityDescription(dto : PersonContactRelationshipDTO_ACC, delete : Boolean) : String {
    var sb = new StringBuilder()

    var contactName = {dto.ContactFirstName, dto.ContactMiddleName, dto.ContactLastName}
        .filterNulls()
        .join(" ")

    if (delete) {
      sb.append("Request: Delete contact relationship\n")
    } else {
      sb.append("Request: Create contact relationship\n")
    }

    if (GosuStringUtil.isNotBlank(dto.ContactACCNumber)) {
      sb.append("Contact ACCNumber: ")
      sb.append(dto.ContactACCNumber)
      sb.append("\n")
    }

    if (contactName.NotBlank) {
      sb.append("Contact Name: ")
      sb.append(contactName)
      sb.append("\n")
    }

    if (dto.ContactDateOfBirth != null) {
      sb.append("Date of Birth: ")
      sb.append(StringUtil.formatDate(dto.ContactDateOfBirth, "short"))
      sb.append("\n")
    }

    if (dto.ContactEmailAddress != null) {
      sb.append("Contact Email Address: ")
      sb.append(dto.ContactEmailAddress)
      sb.append("\n")
    }
    if (dto.ContactPhoneNumber != null) {
      sb.append("Contact Phone Number: ")
      sb.append(dto.ContactPhoneNumber)
      sb.append("\n")
    }

    sb.append("Account Role: ")
    sb.append(dto.AccountRole.DisplayName)
    sb.append("\n")

    if (dto.ThirdPartyRelation != null) {
      sb.append("Third Party Relation: ")
      sb.append(dto.ThirdPartyRelation.DisplayName)
      sb.append("\n")
    }

    if (dto.EmployeeRelation != null) {
      sb.append("Employee Relation: ")
      sb.append(dto.EmployeeRelation.DisplayName)
      sb.append("\n")
    }

    return sb.toString()
  }

  private function createActivityDescription(dto : CompanyContactRelationshipDTO_ACC, delete : Boolean) : String {
    var sb = new StringBuilder()
    if (delete) {
      sb.append("Request: Delete contact relationship\n")
    } else {
      sb.append("Request: Create contact relationship\n")
    }

    if (GosuStringUtil.isNotBlank(dto.ContactACCNumber)) {
      sb.append("Contact ACCNumber: ")
      sb.append(dto.ContactACCNumber)
      sb.append("\n")
    }

    if (GosuStringUtil.isNotBlank(dto.ContactName)) {
      sb.append("Contact Name: ")
      sb.append(dto.ContactName)
      sb.append("\n")
    }

    if (dto.ContactEmailAddress != null) {
      sb.append("Contact Email Address: ")
      sb.append(dto.ContactEmailAddress)
      sb.append("\n")
    }
    if (dto.ContactPhoneNumber != null) {
      sb.append("Contact Phone Number: ")
      sb.append(dto.ContactPhoneNumber)
      sb.append("\n")
    }

    sb.append("Account Role: ")
    sb.append(dto.AccountRole.DisplayName)
    sb.append("\n")
    return sb.toString()
  }

  private function checkRequiredFields(dto : CompanyContactRelationshipDTO_ACC, isDelete : Boolean) {
    if (dto.AccountRole == null && !isDelete) {
      throw new RuntimeException("AccountRole is required.")
    }
    if (GosuStringUtil.isBlank(dto.ContactACCNumber)
        && GosuStringUtil.isBlank(dto.ContactName)) {
      throw new RuntimeException("ContactACCNumber or ContactName is required.")
    }
  }

  private function checkRequiredFields(dto : PersonContactRelationshipDTO_ACC, isDelete : Boolean) {
    if (!isDelete) {
      if (dto.AccountRole == null) {
        throw new RuntimeException("AccountRole is required.")
      }
      if (dto.AccountRole == AccountContactRole.TC_AUTHORISED3RDPARTY_ACC && dto.ThirdPartyRelation == null) {
        throw new RuntimeException("ThirdPartyRelation is required for ${AccountContactRole.TC_AUTHORISED3RDPARTY_ACC}")
      }
      if (dto.AccountRole == AccountContactRole.TC_AUTHORISEDCOMPANYEMPLOYEE_ACC && dto.EmployeeRelation == null) {
        throw new RuntimeException("EmployeeRelation is required for ${AccountContactRole.TC_AUTHORISEDCOMPANYEMPLOYEE_ACC}")
      }
    }
    if (GosuStringUtil.isBlank(dto.ContactACCNumber)
        && (GosuStringUtil.isBlank(dto.ContactFirstName) or GosuStringUtil.isBlank(dto.ContactLastName))) {
      throw new RuntimeException("ContactACCNumber or (ContactFirstName and ContactLastName) is required.")
    }
  }
}