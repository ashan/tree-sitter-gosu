package gw.plugin.contact.impl

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.plugin.contact.ContactResult
uses gw.util.GosuStringUtil

enhancement ContactSearchCriteriaEnhancement: entity.ContactSearchCriteria {

  function performSearch(): ContactResultWrapper {

    if (this.ACCID == "A0000000") {
      var warningMsg = DisplayKey.get("Contact.Search.Warning.UnknownShareholder")
      return new ContactResultWrapper({}, warningMsg)
    }

    var internalResults: IQueryBeanResult<Contact>

    if (GosuStringUtil.isBlank(this.ACCID)) {
      internalResults = this.searchInternal()

    } else {
      internalResults = this.searchByACCID(this.ContactType, this.ACCID)
    }

    var iter = internalResults.iterator()
    var results = new ArrayList<ContactResult>()
    var uids = new HashSet()
    var warningMsg: String
    while (iter.hasNext()) {
      var contact = iter.next()
      results.add(new ContactResultInternal(contact))
      if (contact.AddressBookUID != null) {
        uids.add(contact.AddressBookUID)
      }
    }

    if (GosuStringUtil.isBlank(this.ACCID)) {
      // Not searching by ACCID. Allow searching contact manager

      var currentUser: User = User.util.CurrentUser
      if (not currentUser.isUseProducerCodeSecurity()) {
        try {
          var remoteResults = this.searchExternalContacts()
          for (result in remoteResults) {
            if (not uids.contains(result.ContactAddressBookUID)) {
              results.add(result)
            }
          }
        } catch (e: Exception) {
          if (results.Empty) {
            warningMsg = e.Message
          } else {
            // we need to explain that we have local results, but none from ContactCenter
            warningMsg = DisplayKey.get("Contact.Search.Warning.NoExternalResults", e.Message)
          }
        }
      }
    }

    return new ContactResultWrapper(results.toTypedArray(), warningMsg)
  }

  property get ContactType(): typekey.ContactType {
    return gw.api.util.TypeUtil.isNominallyOrStructurallyAssignable(Person.Type, this.ContactIntrinsicType) ?
        typekey.ContactType.TC_PERSON : typekey.ContactType.TC_COMPANY
  }

  protected function searchByACCID(contactType: ContactType, accID: String): IQueryBeanResult<Contact> {

    var queryResult: IQueryBeanResult<Contact> = null

    if (contactType == ContactType.TC_PERSON) {

      queryResult = Query.make(entity.Person)
          .compareIgnoreCase(Person#ACCID_ACC, Relop.Equals, accID)
          .select()

    } else if (contactType == ContactType.TC_COMPANY) {

      queryResult = Query.make(entity.Company)
          .compareIgnoreCase(Company#ACCID_ACC, Relop.Equals, accID)
          .select()
    }

    return queryResult
  }

}
