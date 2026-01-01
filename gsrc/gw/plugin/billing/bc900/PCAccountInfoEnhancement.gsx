package gw.plugin.billing.bc900

uses java.util.ArrayList
uses wsi.remote.gw.webservice.bc.bc900.entity.types.complex.PCAccountInfo
uses wsi.remote.gw.webservice.bc.bc900.entity.types.complex.PCContactInfo
uses wsi.remote.gw.webservice.bc.bc900.entity.anonymous.elements.PCAccountInfo_BillingContacts

@Export
@Deprecated(:value="900 inter-app integration packages will be removed in PC11.", :version="PC 10.0.0")
enhancement PCAccountInfoEnhancement : PCAccountInfo
{
  function sync(account : Account){
    this.AccountNumber = account.AccountNumber
    this.AccountName = account.AccountHolderContact.AccountName
    this.AccountNameKanji = account.AccountHolderContact.AccountNameKanji

    this.CustomerServiceTier = account.ServiceTier.Code

    var insuredContact = new PCContactInfo()
    insuredContact.sync(account.AccountHolderContact)
    this.InsuredContact.$TypeInstance = insuredContact

    var insuredContactID = account.AccountHolderContact.ID

    var billingContacts = new ArrayList<PCContactInfo>()
    var accountBillingContacts = account.getAccountContactsWithRole(typekey.AccountContactRole.TC_BILLINGCONTACT)
    for (b in accountBillingContacts) {
      if (insuredContactID == b.Contact.ID) {
        this.InsuredIsBilling = true
      } else {
        var PCContactInfo = new PCContactInfo()
        PCContactInfo.sync(b.Contact)
        PCContactInfo.Primary_ACC = false
        billingContacts.add(PCContactInfo)
      }
    }

    var primaryContact = account.PrimaryContact_ACC
    if (primaryContact != null) {
      var PCContactInfo = new PCContactInfo()
      PCContactInfo.sync(primaryContact)
      PCContactInfo.Primary_ACC = true
      billingContacts.add(PCContactInfo)
    }

    if (this.InsuredIsBilling == null) {
      this.InsuredIsBilling = false
    }
    billingContacts.each(\p -> {
      var element = new PCAccountInfo_BillingContacts()
      element.$TypeInstance = p
      this.BillingContacts.add(element)
    })
    // Geoff Infield 2016-12-12 US203 Sync new ACC columns
    this.IRDNumber_ACC = account.IRDNumber_ACC
    // Chris A 2019-02-28 NTK-2561 PC to BC Integration - add Derived IRD number
    this.IRDNumberDerived_ACC = account.IRDNumberDerived_ACC

    this.ACCID_ACC = account.ACCID_ACC
    this.StatusOfAccount_ACC = account.StatusOfAccount_ACC.Code

    this.TradingName_ACC = account.TradingName_ACC
    if (account.BalanceDate_ACC != null) {
      this.BalanceDate_ACC = new gw.xml.date.XmlDate(account.BalanceDate_ACC.toCalendar(), true)
    }
    this.NZBN_ACC = account.NZBN_ACC
    this.EntityType_ACC = account.EntityType_ACC
    this.Source_ACC = account.Source_ACC.DisplayName
    this.RelationshipManager_ACC = account.RelationshipManager_ACC.DisplayName
    var primaryPhone = account.RelationshipManager_ACC.Contact.PrimaryPhone
    if (primaryPhone == PrimaryPhoneType.TC_HOME) {
      this.RelationshipManagerPhoneNumber_ACC = account.RelationshipManager_ACC.Contact.HomePhone
    } else if (primaryPhone == PrimaryPhoneType.TC_MOBILE) {
      this.RelationshipManagerPhoneNumber_ACC = account.RelationshipManager_ACC.Contact.CellPhone
    } else if (primaryPhone == PrimaryPhoneType.TC_WORK) {
      this.RelationshipManagerPhoneNumber_ACC = account.RelationshipManager_ACC.Contact.WorkPhone
    }
    this.AccountStatus = account.AccountStatus.DisplayName

    //Jaykumar : US1399 09/06/2017
    this.AEPActivityExists_ACC = account.AEPActivityExists_ACC
    this.AEPContractAccount_ACC = account.AEPContractAccount_ACC
    this.AEPContractNumber_ACC = account.AEPContractNumber_ACC
    if (account.AEPAgreementOrigSignedDate_ACC != null) {
      this.AEPAgreementOrigSignedDate_ACC =
          new gw.xml.date.XmlDate(account.AEPAgreementOrigSignedDate_ACC.toCalendar(), true)
    }
  }
}
