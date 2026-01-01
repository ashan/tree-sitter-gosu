package nz.co.acc.lob.cpx

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.rating.worksheet.domain.WorksheetCalculation

uses java.math.BigDecimal

enhancement INDCPXLineEnhancement: entity.INDCPXLine {

  function createAndAddINDCPXCov(): INDCPXCov {
    var cbl = new INDCPXCov(this.Branch)
    this.addToINDCPXCovs(cbl)
    cbl.syncModifiers()
    cbl.syncCoverages()
    return cbl
  }

  function displayPartnershipDetails_ACC() : boolean {
    var businessStructure = this.BusinessStructure
    return businessStructure == BusinessStructure_ACC.TC_PARTNER
        or businessStructure == BusinessStructure_ACC.TC_SOLESHAREHOLDER
        or businessStructure == BusinessStructure_ACC.TC_TWOPLUSSHAREHOLDER
  }

  /**
   * For adding partner or shareholder on CPX policies
   * @param contact
   * @return
   */
  function addNewPartnerOrShareholderForContact(contact : Contact): PartnershipDetails_ACC {
    // Same contact cannot be added twice
    if (this.PartnershipDetails.hasMatch(\ partnerOrShareholder -> partnerOrShareholder.AccountContactRole.AccountContact.Contact == contact)) {
      throw new DisplayableException(DisplayKey.get("Web.CoverPlusExtra_ACC.Coverage.PartnershipDetails.AlreadyExists", contact))
    }

    // Only one partner or shareholder with the same ACCID may be added
    if (this.PartnershipDetails.hasMatch(\ partnerOrShareholder -> (partnerOrShareholder.AssociatedContact.ACCID_ACC.NotBlank and contact.ACCID_ACC.NotBlank) and partnerOrShareholder.AssociatedContact.ACCID_ACC == contact.ACCID_ACC)) {
      throw new DisplayableException(DisplayKey.get("Web.CoverPlusExtra_ACC.Coverage.PartnershipDetails.ACCNumberAlreadyExists", contact.ACCID_ACC))
    }

    // Set the partnership details
    var partnershipDetails = this.Branch.addNewPolicyContactRoleForContact(contact, typekey.PolicyContactRole.TC_PARTNERSHIPDETAILS_ACC) as PartnershipDetails_ACC
    partnershipDetails.AssociatedContact = contact

    // Determine if contact is a person or company and update PolicyContactType accordingly
    if (contact typeis Person) {
      partnershipDetails.PolicyContactType = ContactType.TC_PERSON
    } else if (contact typeis Company) {
      partnershipDetails.PolicyContactType = ContactType.TC_COMPANY
    }

    this.addToPartnershipDetails(partnershipDetails)

    return partnershipDetails
  }

  function removeINDCPXCov(cbl: INDCPXCov) {
    this.removeFromINDCPXCovs( cbl )
  }

  function findALOCFactorFromEarnersLevyCost_ACC(costsByCbl : Map<Coverable, List<CPXCost>>) : BigDecimal {
    // Find the INDCPXEarnersLevyCost from the costsByCbl
    var earnersLevyCost = costsByCbl.get(this.INDCPXCovs.first())?.where(\elt -> elt typeis INDCPXEarnersLevyCost)?.first()
    if (earnersLevyCost != null) {
      // Create the worksheet
      var worksheet = (earnersLevyCost.BranchUntyped as PolicyPeriod).getWorksheetFor(earnersLevyCost)
      if (worksheet != null) {
        var calculationWorksheetEntries = worksheet.AllWorksheetEntries.where(\elt -> elt typeis WorksheetCalculation)
        if (calculationWorksheetEntries != null) {
          var alocCalculation = calculationWorksheetEntries.where(\elt1 -> (elt1 as WorksheetCalculation).StoreLocation == "ALOCFactor")
          if (alocCalculation != null) {
            var alocFactor = (alocCalculation.first() as WorksheetCalculation).Result as BigDecimal
            return alocFactor
          }
        }
      }
    }
    // Return a default
    return BigDecimal.ONE
  }

  property get EmploymentStatusDisplayString_ACC() : String {
    if (this.EmploymentStatus == Boolean.TRUE) {
      return DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.FullTime")
    } else if (this.EmploymentStatus == Boolean.FALSE) {
      return DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.PartTime")
    } else {
      // EmploymentStatus == null
      return ""
    }
  }

}