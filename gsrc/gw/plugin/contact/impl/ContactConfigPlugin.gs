package gw.plugin.contact.impl

uses gw.api.locale.DisplayKey
uses gw.entity.TypeKey
uses gw.lang.reflect.TypeSystem
uses gw.plugin.contact.IContactConfigPlugin
uses gw.util.AutoMap
uses typekey.AccountContactRole
uses typekey.PolicyContactRole


@Export
class ContactConfigPlugin implements IContactConfigPlugin {
  
  protected var _accountContactRoleConfigLookup : Map<typekey.AccountContactRole, ContactConfig> = new AutoMap<typekey.AccountContactRole, ContactConfig>(\ a : typekey.AccountContactRole -> ContactConfig.EMPTY_CONTACT_CONFIG)
  protected var _policyContactRoleConfigLookup : Map<typekey.PolicyContactRole, ContactConfig> = new AutoMap<typekey.PolicyContactRole, ContactConfig>(\ p : typekey.PolicyContactRole -> ContactConfig.EMPTY_CONTACT_CONFIG)
  
  protected property get DefaultConfigs() : ContactConfig[] {
    return {
      new ContactConfig(true, {TC_COMPANY, TC_PERSON}, TC_ACCOUNTHOLDER,      {}),
      new ContactConfig(false, {TC_COMPANY, TC_PERSON}, TC_ACCOUNTINGCONTACT,  {}),
      new ContactConfig(false, {TC_COMPANY, TC_PERSON}, TC_ADDITIONALINSURED,  {TC_POLICYADDLINSURED}),
      new ContactConfig(false, {TC_COMPANY, TC_PERSON}, TC_ADDITIONALINTEREST, {TC_POLICYADDLINTEREST}),
      new ContactConfig(true, {TC_COMPANY, TC_PERSON}, TC_BILLINGCONTACT,     {TC_POLICYBILLINGCONTACT}),
      new ContactConfig(true, {TC_COMPANY, TC_PERSON}, TC_CLAIMSINFOCONTACT,  {}),
      new ContactConfig(false, {            TC_PERSON}, TC_DRIVER,             {TC_POLICYDRIVER}),
      new ContactConfig(false, {TC_COMPANY, TC_PERSON}, TC_INSPECTIONCONTACT,  {}),
      new ContactConfig(false, {TC_COMPANY           }, TC_LABORCLIENT,        {TC_POLICYLABORCLIENT}),
      new ContactConfig(false, {TC_COMPANY           }, TC_LABORCONTRACTOR,    {TC_POLICYLABORCONTRACTOR}),
      new ContactConfig(true, {TC_COMPANY, TC_PERSON}, TC_NAMEDINSURED,       {TC_POLICYPRINAMEDINSURED, TC_POLICYSECNAMEDINSURED, TC_POLICYADDLNAMEDINSURED}),
      new ContactConfig(false, {            TC_PERSON}, TC_OWNEROFFICER,       {TC_POLICYOWNEROFFICER}),
      new ContactConfig(true, {TC_COMPANY, TC_PERSON}, TC_SECONDARYCONTACT,   {}),

      new ContactConfig(true, {TC_COMPANY, TC_PERSON}, TC_APDINVOLVEDPARTY,  {TC_APDPOLICYINVOLVEDPARTY}),
        //ACC NEW roles
        new ContactConfig(true, {TC_PERSON}, TC_AUTHORISED3RDPARTY_ACC,         {}),
        new ContactConfig(true, {TC_PERSON}, TC_AUTHORISEDCOMPANYEMPLOYEE_ACC,  {}),
        new ContactConfig(true, {TC_COMPANY, TC_PERSON}, TC_AGENTANDACCOUNTANTS_ACC,        {}),
        new ContactConfig(true, {TC_COMPANY, TC_PERSON}, TC_LIQUIDATORCONTACT_ACC,          {}),
        new ContactConfig(true, {TC_COMPANY, TC_PERSON}, TC_RECEIVERSHIPCONTACT_ACC,        {}),

        // ACC Shareholder roles
        new ContactConfig(true, {TC_PERSON, TC_COMPANY}, TC_SHAREHOLDERCONTACT_ACC, {TC_POLICYSHAREHOLDER_ACC}),

        // ACC CPX Associated contact roles
        new ContactConfig(true, {TC_PERSON, TC_COMPANY}, TC_PARTNERSHIPCONTACT_ACC, {TC_PARTNERSHIPDETAILS_ACC}),

        // ACC EAP Account - Can add contact if account holder is and AEP company contact
        new ContactConfig(true, {TC_COMPANY, TC_PERSON}, TC_PRIMEBUSINESSCONTACT_ACC,   {}),
        new ContactConfig(true, {TC_COMPANY, TC_PERSON}, TC_CLAIMSADMINISTRATOR_ACC,    {}),
        new ContactConfig(true, {TC_COMPANY, TC_PERSON}, TC_FINANCECONTACT_ACC,         {}),
        new ContactConfig(true, {TC_COMPANY, TC_PERSON}, TC_TPACONTACT_ACC,             {}),
        new ContactConfig(true, {TC_COMPANY, TC_PERSON}, TC_FINANCEMANAGERCONTACT_ACC, {}),
        new ContactConfig(true, {TC_COMPANY, TC_PERSON}, TC_HEALTHANDSAFETYREPCONTACT_ACC, {})
    }
  }
  
  public static final var AEP_ONLY_ACCOUNT_ROLES :  typekey.AccountContactRole[] = {TC_PRIMEBUSINESSCONTACT_ACC, TC_CLAIMSADMINISTRATOR_ACC, TC_FINANCECONTACT_ACC, TC_TPACONTACT_ACC}
  public static final var NOT_FOR_AEP_ACCOUNTS :  typekey.AccountContactRole[] = {TC_LIQUIDATORCONTACT_ACC, TC_RECEIVERSHIPCONTACT_ACC}

  public construct() {
    loadDefaultConfig()
    validateAllConcreteUnretiredAccountContactRoleTypesAreInLookup()
    validateAllConcreteUnretiredPolicyContactRoleTypesAreInLookup()
  }
  
  final public function loadDefaultConfig() {
    for (config in DefaultConfigs) {
      validateConfig(config)
      loadConfig(config)
    }
  }
  
  final protected function validateConfig(config : ContactConfig) {
    if (_accountContactRoleConfigLookup.containsKey(config.AccountContactRoleType)) {
      throw new IllegalArgumentException(DisplayKey.get("ContactConfigPlugin.Error.MultipleAccountContactRoles", config.AccountContactRoleType))
    }
    if (config.AccountContactRoleType.Retired) {
      throw new IllegalArgumentException(DisplayKey.get("ContactConfigPlugin.Error.RetiredAccountContactRole", config.AccountContactRoleType))
    }
    if (isSubtypeKeyAbstract(config.AccountContactRoleType)) {
      throw new IllegalArgumentException(DisplayKey.get("ContactConfigPlugin.Error.AbstractAccountContactRole", config.AccountContactRoleType))
    }
    for (pcrType in config.PolicyContactRoleTypes) {
      if (_policyContactRoleConfigLookup.containsKey(pcrType)) {
        throw new IllegalArgumentException(DisplayKey.get("ContactConfigPlugin.Error.MultiplePolicyContactRoles", pcrType))
      }
      if (pcrType.Retired) {
        throw new IllegalArgumentException(DisplayKey.get("ContactConfigPlugin.Error.RetiredPolicyContactRole", pcrType))
      }
      if (isSubtypeKeyAbstract(pcrType)) {
        throw new IllegalArgumentException(DisplayKey.get("ContactConfigPlugin.Error.AbstractPolicyContactRole", pcrType))
      }
    }
  }
  
  public function loadConfig(config : ContactConfig) {
    _accountContactRoleConfigLookup.put(config.AccountContactRoleType, config)
    for (pcrType in config.PolicyContactRoleTypes) {
      _policyContactRoleConfigLookup.put(pcrType, config)
    }
  }

  final protected function validateAllConcreteUnretiredAccountContactRoleTypesAreInLookup() {
    for (acrType in typekey.AccountContactRole.getTypeKeys(false)) {
      if (not isSubtypeKeyRetiredOrAbstract(acrType) and not _accountContactRoleConfigLookup.containsKey(acrType)) {
        throw new IllegalStateException(DisplayKey.get("ContactConfigPlugin.Error.UnconfiguredAccountContactRole", acrType))
      }
    }
  }
  
  final protected function validateAllConcreteUnretiredPolicyContactRoleTypesAreInLookup() {
    for (pcrType in typekey.PolicyContactRole.getTypeKeys(false)) {
      if (not isSubtypeKeyRetiredOrAbstract(pcrType) and not _policyContactRoleConfigLookup.containsKey(pcrType)) {
        throw new IllegalStateException(DisplayKey.get("ContactConfigPlugin.Error.UnconfiguredPolicyContactRole", pcrType))
      }
    }
  }
  
  override function getAllowedContactTypesForAccountContactRoleType(subtypeKey : typekey.AccountContactRole): typekey.ContactType[] {
    return _accountContactRoleConfigLookup.get(subtypeKey).ContactTypes.toTypedArray()
  }

  override function getAllowedContactTypesForPolicyContactRoleType(subtypeKey : typekey.PolicyContactRole): typekey.ContactType[] {
    return _policyContactRoleConfigLookup.get(subtypeKey).ContactTypes.toTypedArray()
  }
  
  override function canBeRole(contactType : typekey.ContactType, accountContactRoleSubtypeKey : typekey.AccountContactRole) : boolean {
    return getAllowedContactTypesForAccountContactRoleType(accountContactRoleSubtypeKey).contains(contactType)
  }
  
  private function isSubtypeKeyRetiredOrAbstract(subtypeKey : TypeKey) : boolean {
    return subtypeKey.Retired or isSubtypeKeyAbstract(subtypeKey)
  }

  private function isSubtypeKeyAbstract(subtypeKey : TypeKey) : boolean {
    return TypeSystem.getByFullName("entity." + subtypeKey.Code).Abstract
  }
  
  override function isAccountContactTypeAvailable(subtypeKey : typekey.AccountContactRole) : boolean {
    return subtypeKey != null and not isSubtypeKeyRetiredOrAbstract(subtypeKey) and _accountContactRoleConfigLookup.get(subtypeKey).Enabled
  }

  override property get AvailableAccountContactRoleTypes() : typekey.AccountContactRole[] {
    return typekey.AccountContactRole.getTypeKeys(false).where(\ a -> isAccountContactTypeAvailable(a)).toTypedArray()
  }

  override function getAccountContactRoleTypeDisplayName(subtypeKey : typekey.AccountContactRole) : String {
    return TypeSystem.getByFullName("entity." + subtypeKey).TypeInfo.DisplayName
  }

  override function getAccountContactRoleTypeFor(subtypeKey : typekey.PolicyContactRole): typekey.AccountContactRole {
    return _policyContactRoleConfigLookup.get(subtypeKey).AccountContactRoleType
  }

  override function minimumCriteriaSet(searchCriteria : ContactSearchCriteria) : boolean {

    //User search is already well restricted
    if (searchCriteria.ContactSubtype == typekey.Contact.TC_USERCONTACT) return true
    //AccreditationNumber_ACC and Phone number are considered to be minimially sufficent in all cases on their own.
    //If searching for a company, then company name is also sufficent is it has at least five characters
    //A personal name requires that it be used in conjunction with a city/state or a zip code.
    if (searchCriteria.Phone.NotBlank) return true
    
    if (searchCriteria.ContactSubtype == typekey.Contact.TC_PERSON) {
      var has_location = searchCriteria.Address.PostalCode.NotBlank ||
                         ((searchCriteria.Address.City.NotBlank || searchCriteria.Address.CityKanji.NotBlank)
                             && searchCriteria.Address.State != null)
      var has_firstname = (searchCriteria.FirstName.NotBlank && (searchCriteria.FirstName.length >= 3 || searchCriteria.FirstNameExact))
      var has_lastname = (searchCriteria.Keyword.NotBlank && (searchCriteria.Keyword.length >= 3 || searchCriteria.KeywordExact))
      var has_name = has_firstname && has_lastname

      var hasKanjiName = searchCriteria.FirstNameKanji.NotBlank || searchCriteria.KeywordKanji.NotBlank

      return has_name && (searchCriteria.KeywordExact || has_location || searchCriteria.PermissiveSearch)
          || hasKanjiName
    }
    else if (searchCriteria.ContactSubtype == typekey.Contact.TC_COMPANY) {
      //if taxid or phone was provided we've already bailed.
      if (searchCriteria.Keyword.NotBlank && (searchCriteria.KeywordExact ||
                                              searchCriteria.Keyword.length() >= 5 ||
                                              searchCriteria.PermissiveSearch)) return true
      if (searchCriteria.KeywordKanji.NotBlank) return true
    }
    return false
  }
}
