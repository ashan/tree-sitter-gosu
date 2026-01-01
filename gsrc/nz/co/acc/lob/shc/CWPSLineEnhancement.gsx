package nz.co.acc.lob.shc

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.path.Paths
uses gw.api.policy.period.PolicyPeriodQueryFilters
uses gw.api.util.DisplayableException
uses gw.util.Pair
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.lob.cpx.INDCPXCovUtil_ACC
uses entity.CWPSLineMod
uses entity.Contact

uses java.math.BigDecimal

enhancement CWPSLineEnhancement : entity.CWPSLine {

  function createAndAddCWPSCov() : CWPSCov {
    var cbl = new CWPSCov(this.Branch)
    this.addToCWPSCovs(cbl)
    cbl.syncModifiers()
    cbl.syncCoverages()
    return cbl
  }

  function getShareholderFromContact(contact : Contact) : PolicyShareholder_ACC {
    return this.PolicyShareholders.firstWhere(\shareholder -> shareholder.AccountContactRole.AccountContact.Contact == contact)
  }

  function addNewPolicyShareholderForContact(contact : Contact) : PolicyShareholder_ACC {
    if (this.PolicyShareholders.hasMatch(\shareholder -> shareholder.AccountContactRole.AccountContact.Contact == contact)) {
      throw new DisplayableException(DisplayKey.get("Web.PolicyShareholder.Error.AlreadyExists", contact))
    }

    // Only one shareholder with the same ACCID may be added
    if (this.PolicyShareholders.hasMatch(\shareholder -> (!contact.DummyContact_ACC)
        and (shareholder.PolicyContact.ACCID_ACC.NotBlank and shareholder.PolicyContact.ACCID_ACC == contact.ACCID_ACC))) {
      throw new DisplayableException(DisplayKey.get("Web.PolicyShareholder.Error.ACCNumberAlreadyExists", contact.ACCID_ACC))
    }

    var policyShareholder = this.Branch.addNewPolicyContactRoleForContact(contact, TC_POLICYSHAREHOLDER_ACC) as PolicyShareholder_ACC

    policyShareholder.initializeFields(this.AssociatedPolicyPeriod)
    policyShareholder.PolicyContact = contact

    // Determine if contact is a person or company and update PolicyContactType accordingly
    // The PolicyContactType is used to determine the liable earnings
    if (contact typeis Person) {
      policyShareholder.PolicyContactType = ContactType.TC_PERSON

      // find the latest bound CPX policy period and update the policy shareholder's CPX details with it.
      var cpxPolicyPeriod = findCPXPolicyForContact(contact, this.Branch.LevyYear_ACC)
      if (cpxPolicyPeriod != null) {

        var cpxDatesList = new ArrayList<Pair<Date, Date>>()
        var wpsDatesPair = new Pair<Date, Date>(this.Branch.PeriodStart, this.Branch.PeriodEnd)

        for (cpxinfoCovs in cpxPolicyPeriod.getSlice(cpxPolicyPeriod.PeriodStart).INDCPXLine?.INDCPXCovs?.first().CPXInfoCovs) {
          var cpxDatesPair = new Pair<Date, Date>(cpxinfoCovs.PeriodStart, cpxinfoCovs.PeriodEnd)
          if (!DateUtil_ACC.isDateRangeCompletelyOutside(cpxDatesPair, wpsDatesPair)) {
            cpxDatesList.add(cpxDatesPair)
          }
        }

        var newCpxAmendedDates = INDCPXCovUtil_ACC.adjustCPXDatesForWPS(cpxDatesList, wpsDatesPair)

        for (cpxDates in newCpxAmendedDates) {

          var details = new PolicySHECPXDetails_ACC(this.Branch)
          details.cpxStartDate = cpxDates.First
          details.cpxEndDate = cpxDates.Second
          details.policyNumber = cpxPolicyPeriod.PolicyNumber
          policyShareholder.addToPolicySHECPXDetails(details)
        }
      }
    } else if (contact typeis Company) {
      policyShareholder.PolicyContactType = ContactType.TC_COMPANY
    }

    // Set the CU code to the current primary CU
    for (bic in this.BICCodes) {
      if (bic.isPrimary()) {
        for (shareholderEarnings in policyShareholder.ShareholderEarnings) {
          shareholderEarnings.CUCode = bic.CUCode
        }
      }
    }

    this.addToPolicyShareholders(policyShareholder)
    return policyShareholder
  }

  function removePolicyShareholder(shareholder : PolicyShareholder_ACC) {
    this.removeFromPolicyShareholders(shareholder)
  }

  function removeShareholderEarning(shareholderEarnings : ShareholderEarnings_ACC) {
    // Remove the shareholder earning from the policy shareholder.
    // If there are no more shareholder earnings left then remove the policy shareholder too.
    var shareholder = shareholderEarnings.ShareholderID
    shareholder.removeFromShareholderEarnings(shareholderEarnings)
    if (shareholder.shareholderEarningsCount() == 0) {
      this.removeFromPolicyShareholders(shareholder)
    }
    // DE662 - Remove from the Account Contacts
    if (shareholder.AccountContactRole typeis ShareholderContact_ACC) {
      var accountContactRole = shareholder.AccountContactRole
      var accountContact = accountContactRole.AccountContact
      if (accountContact.isNew()) {
        var bundle = gw.transaction.Transaction.getCurrent()
        accountContact = bundle.add(accountContact)
        accountContact.Account.removeFromAccountContacts(accountContact)
        bundle.commit()
      }
    }
  }

  function removeCWPSCov(cbl : CWPSCov) {
    this.removeFromCWPSCovs(cbl)
  }

  function findCPXPolicyForContact(contact : Contact, yearOfDate : Integer) : PolicyPeriod {
    var cpxPeriodsQuery = Query.make(PolicyPeriod)

    // Filter for specific year
    cpxPeriodsQuery.compare(PolicyPeriod#LevyYear_ACC, Equals, yearOfDate)

    // Filter for canceled
    cpxPeriodsQuery.compare("CancellationDate", Equals, null)

    // Filter for bound
    cpxPeriodsQuery.compare("ModelNumber", NotEquals, null)

    // Join # 1 - to fetch only the CPX policies
    var policyLineQuery = cpxPeriodsQuery.join(PolicyLine, "BranchValue")
    policyLineQuery.compare("PatternCode", Equals, "INDCPXLine")

    // Join # 2 - to fetch only for the given contact
    var policyContactRoleTable = cpxPeriodsQuery.join(PolicyContactRole, "BranchValue")
    // Grab policies that are related to the contact
    policyContactRoleTable.compare("ContactDenorm", Equals, contact)

    // Return the most recent one if there were more than one periods for the cpx policy
    var orderByColumn = QuerySelectColumns.path(Paths.make(PolicyPeriod#UpdateTime))

    return cpxPeriodsQuery.select().orderBy(orderByColumn).last()
  }

  function updateModifiersBasedOnKeyword(searchString : String, exactMatch : boolean) {
    var discountAppliedModifiers = this.SHCLineModifiers.where(\elt -> elt.Pattern.CodeIdentifier.contains(searchString) == exactMatch)
    for (modifier in discountAppliedModifiers) {
      modifier.BooleanModifier = false
    }
  }

  function getSelectedDiscountAppliedModifier() : DiscountsAppliedSelection_ACC {
    if (hasSelectedModifier("WSD")) {
      return DiscountsAppliedSelection_ACC.TC_WSD
    } else if (hasSelectedModifier("WSMP")) {
      return DiscountsAppliedSelection_ACC.TC_WSMP
    }
    return null
  }

  function getSelectedExperienceRatingModifier() : CWPSLineMod {
    return this.SHCLineModifiers.where(\elt -> elt.Pattern.CodeIdentifier.equals("CWPSExpRatingProgramme")).first()
  }

  function hasSelectedModifier(searchString : String) : boolean {
    var discountModifiers = this.SHCLineModifiers.where(\elt -> elt.Pattern.CodeIdentifier.contains(searchString))
    for (modifier in discountModifiers) {
      if (modifier.BooleanModifier)
        return true
    }
    return false
  }

  function allShareholderEarnings() : ShareholderEarnings_ACC[] {
    var all = new ArrayList<ShareholderEarnings_ACC>()
    for (shareholder in this.PolicyShareholders) {
      all.addAll(shareholder.ShareholderEarnings?.toList())
    }
    return all.toTypedArray()
  }

  function initializeSHCModifiers() {
    for (modifiers in this.SHCLineModifiers) {
      if (modifiers.StartEndDate == null) {
        modifiers.StartEndDate = new StartEndDates_ACC(this.Branch)
      }
    }
  }

  function typeKeyModifiersAsList() : List<String> {
    var typeKeyModifierList = new ArrayList<String>()
    var productModifiers = this.SHCLineModifiers
    if (productModifiers != null) {
      for (productModifier in productModifiers) {
        if (productModifier.TypeKeyModifier != null) { // exclude nulls
          typeKeyModifierList.add(productModifier.TypeKeyModifier)
        }
      }
    }
    return typeKeyModifierList
  }

  property get SHEOnCPXIndicator() : boolean {

    // Chris A 29/09/2020 JUNO-459 used in PolicyPeriodModel.gx for invoiceDataAPI webservice
    return this.PolicyShareholders.hasMatch(\policyShareholder_acc -> policyShareholder_acc.PolicySHECPXDetails
        .hasMatch(\policySHECPXDetailsAcc -> policySHECPXDetailsAcc.PolicyShareholder == policyShareholder_acc))
  }

  function getTotalLiableEarningsByCUCode(cuCode : String) : BigDecimal {
    var shareholderEarnings = this.allShareholderEarnings()
    if(shareholderEarnings.HasElements) {
      var matchedEarnings = shareholderEarnings.where(\elt -> elt.CUCode.equals(cuCode))
      if(matchedEarnings.HasElements) {
        if(this.Branch.Status == PolicyPeriodStatus.TC_BOUND) {
          return matchedEarnings.sum(\elt -> elt.AdjustedLiableEarnings_amt)
        } else {
          return matchedEarnings.sum(\elt -> elt.AuditAdjustedLELessCpx_amt)
        }
      }
    }
    return BigDecimal.ZERO
  }
}