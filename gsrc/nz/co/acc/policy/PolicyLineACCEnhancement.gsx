package nz.co.acc.policy

uses entity.*
uses entity.CWPSLine
uses entity.INDCPXLine
uses entity.INDCoPLine
uses gw.api.financials.CurrencyAmount
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.lob.common.BusinessIndustrySearchCriteria_ACC
uses nz.co.acc.lob.shc.util.CWPSUIUtil_ACC

/**
 * Created by Franklin Manubag on 19/3/2017.
 */
enhancement PolicyLineACCEnhancement: PolicyLine {

  /**
   * removes BIC code
   * @param bicCode
   * @param checkForShareholderEarningCUCode - whether to check for Shareholder Earning linked to primary CU Code.
   *                                         This param was introduced in case same bundle removes primary BIC and makes new BIC as primary e.g. in Edge
   */
  function removeBICCode(bicCode: PolicyLineBusinessClassificationUnit_ACC, checkForShareholderEarningCUCode : boolean) {
    if (this typeis entity.CWPSLine) {
      if (!bicCode.isPrimary()) {
        var shrsMapped = (this as entity.CWPSLine).PolicyShareholders.where(\elt -> elt.anyShareholderEarningsMatchesCUCode(bicCode.CUCode))
        if (!checkForShareholderEarningCUCode or shrsMapped.length == 0 or (shrsMapped.length > 0 and this.BICCodes.where(\elt -> elt.CUCode != null and elt.CUCode.equals(bicCode.CUCode)).length > 1)) {
          this.removeFromBICCodes(bicCode)
          if (this.PrimaryBICCode_ACC != null and
              this.PrimaryBICCode_ACC == bicCode) {
            this.PrimaryBICCode_ACC = null
          }
        } else {
          throw new DisplayableException(DisplayKey.get("Web.Policy.CWPS.CUMappedToShareholder_ACC"))
        }
      } else {
        throw new DisplayableException(DisplayKey.get("Web.Policy.CWPS.PrimaryBICCUShouldNotBeRemoved_ACC"))
      }
    } else {
      this.removeFromBICCodes(bicCode)
    }
  }

  function hasNoDuplicateBICCodes(selectedBICCode: String, businessClassification: PolicyLineBusinessClassificationUnit_ACC): boolean {
    var bicCodeValues = this.BICCodes
    if (bicCodeValues != null) {
      for (bicCodeItem in bicCodeValues) {
        if (bicCodeItem.BICCode != null and
            bicCodeItem.CUCode != null and
            bicCodeItem.BICCode.equals(selectedBICCode) and
            bicCodeItem != businessClassification) {
          return false
        }
      }
    }
    return true
  }

  function setSelectedBIC(selected: entity.BusinessIndustryCode_ACC, businessClassification: PolicyLineBusinessClassificationUnit_ACC): String {
    if (this.hasNoDuplicateBICCodes(selected.BusinessIndustryCode, businessClassification)) {
      businessClassification.BICDescription = selected.BusinessIndustryDescription
      businessClassification.CUCode = selected.ClassificationUnit_ACC.ClassificationUnitCode
      businessClassification.CUDescription = selected.ClassificationUnit_ACC.ClassificationUnitDescription
      businessClassification.ReplacementLabourCost = selected.ClassificationUnit_ACC.ReplacementLabourCost
      if (this typeis entity.INDCoPLine) {
        businessClassification.Percentage = 100
        businessClassification.AdjustedLiableEarnings = new CurrencyAmount(this.INDCoPCovs.first().LiableEarningCov.AdjustedLiableEarnings.Amount, Currency.TC_NZD)
      } else if (this typeis entity.EMPWPCLine) {
        updateEMPWPCBusinessClassificationPercentage(businessClassification)
        // if this is the first BIC the set the adjusted LE
        if (this.BICCodes.length == 1) {
          businessClassification.AdjustedLiableEarnings = new CurrencyAmount(this.EMPWPCCovs.first().LiableEarningCov.AdjustedLiableEarnings.Amount, Currency.TC_NZD)
        } else {
          businessClassification.AdjustedLiableEarnings = new CurrencyAmount(0, Currency.TC_NZD)
        }
      } else if (this typeis entity.CWPSLine) {
        updateCWPSBusinessClassification(businessClassification)
      }
    } else {
      throw new DisplayableException(DisplayKey.get("Web.BusinessClassification_ACC.SelectedBICCodeExists"))
    }

    return selected.BusinessIndustryCode
  }

  function searchForBICCodeInformation(businessClassification: PolicyLineBusinessClassificationUnit_ACC) {
    var criteria = new BusinessIndustrySearchCriteria_ACC()
    criteria.Exact = true
    criteria.EndYear = this.getAssociatedPolicyPeriod().EffectiveDatedFields.ExpirationDate
    criteria.StartYear = this.getAssociatedPolicyPeriod().EffectiveDatedFields.EffectiveDate
    if (businessClassification.BICCode == null) {
      throw new DisplayableException(DisplayKey.get("Web.CoverPlus_ACC.NoBICCodeSet"))
    }
    criteria.BICCode = businessClassification.BICCode.toUpperCase()
    if (businessClassification.BICCode == null) {
      criteria.BICCode = ""
    }
    var searchResult = criteria.performSearch().first()
    if (searchResult != null && this.hasNoDuplicateBICCodes(criteria.BICCode, businessClassification)) {
      businessClassification.BICCode = searchResult.BusinessIndustryCode
      businessClassification.BICDescription = searchResult.BusinessIndustryDescription
      businessClassification.CUCode = searchResult.ClassificationUnit_ACC.ClassificationUnitCode
      businessClassification.CUDescription = searchResult.ClassificationUnit_ACC.ClassificationUnitDescription
      businessClassification.ReplacementLabourCost = searchResult.ClassificationUnit_ACC.ReplacementLabourCost
      businessClassification.Percentage = 0
      businessClassification.LiableEarnings = new CurrencyAmount(0, Currency.TC_NZD)

      if (this typeis productmodel.INDCoPLine) {
        businessClassification.Percentage = 100
        businessClassification.AdjustedLiableEarnings = new CurrencyAmount(this.INDCoPCovs.first().LiableEarningCov.AdjustedLiableEarnings.Amount, Currency.TC_NZD)
      } else if (this typeis productmodel.EMPWPCLine) {
        updateEMPWPCBusinessClassificationPercentage(businessClassification)
      } else if (this typeis entity.CWPSLine) {
        updateCWPSBusinessClassification(businessClassification)
      }
    }
    else {
      var bicCode = businessClassification.BICCode
      businessClassification.clearAllFields()
      businessClassification.BICCode = bicCode
      if(searchResult == null)
        throw new DisplayableException(DisplayKey.get("Web.BusinessClassification_ACC.BICCodeDoesNotExist"))
      else
        throw new DisplayableException(DisplayKey.get("Web.BusinessClassification_ACC.SelectedBICCodeExists"))
    }
  }

  private function updateEMPWPCBusinessClassificationPercentage(businessClassification: PolicyLineBusinessClassificationUnit_ACC) {
    // if this is the first BIC the set the percentage to 100 else 0
    if (this.BICCodes.length == 1) {
      businessClassification.Percentage = 100
    } else {
      businessClassification.Percentage = 0
    }
  }

  private function updateCWPSBusinessClassification(businessClassification: PolicyLineBusinessClassificationUnit_ACC) {
    // update the current shareholders to the new CU if it is primary
    if (businessClassification.isPrimary()) {
      CWPSUIUtil_ACC.updateCWPSShareholderClassificationUnits(businessClassification, this)
    }
    // if this is the first BIC then set the bic to primary
    if (this.BICCodes.length == 1) {
      businessClassification.setAsPrimary()
    }
  }

  function policyLineTypeKeyModifiersAsList() : List<String> {
    var typeKeyModifierList = new ArrayList<String>()
    var productModifiers = this.AssociatedPolicyPeriod.EffectiveDatedFields.ProductModifiers
    if (productModifiers != null) {
      for (productModifier in productModifiers) {
        if (productModifier.TypeKeyModifier != null) { // exclude nulls
          typeKeyModifierList.add(productModifier.TypeKeyModifier)
        }
      }
    }
    return typeKeyModifierList
  }

  function IsOnlyWSD() : boolean {
    var modifierCosts : List<Cost>

    if(this typeis EMPWPCLine) {
      modifierCosts = this.Costs.where(\elt -> elt.ChargePattern == ChargePattern.TC_WAL and
                                               elt typeis EMPWPCModifierCost and
                                               elt.CostDescription.contains("Discount Applied"))
    } else if(this typeis CWPSLine) {
      modifierCosts = this.Costs.where(\elt -> elt.ChargePattern == ChargePattern.TC_WAL and
                                               elt typeis CWPSModifierCost and
                                               elt.CostDescription.contains("Discount Applied"))
    } else if(this typeis INDCoPLine) {
      modifierCosts = this.Costs.where(\elt -> elt.ChargePattern == ChargePattern.TC_WAL and
                                               elt typeis INDCoPModifierCost and
                                               elt.CostDescription.contains("Discount Applied"))
    } else if(this typeis INDCPXLine) {
      modifierCosts = this.Costs.where(\elt -> elt.ChargePattern == ChargePattern.TC_WAL and
                                               elt typeis CPXModifierCost and
                                               elt.CostDescription.contains("Discount Applied"))
    }

    if(modifierCosts.Count == 1 and modifierCosts.first().CostDescription.equals("Discount Applied - WSD")) {
      return true
    }

    return false
  }

  function IsOnlyGSTCost() : boolean {
    return (this?.Costs.Count == 1 and this?.Costs.hasMatch(\elt -> elt.ChargePattern == ChargePattern.TC_GST))
  }

  property get TotalPremium() : MonetaryAmount {
    return this.Costs.where(\elt -> elt.ChargePattern != ChargePattern.TC_GST).sum(\elt -> elt.ActualAmount)
  }

  property get EmploymentStatusAsType() : EmploymentStatusType_ACC {
    var bStatus : Boolean = null
    if(this typeis INDCPXLine) {
      bStatus = this.EmploymentStatus
    } else if(this typeis INDCoPLine) {
      bStatus = this.INDCoPCovs.first().CurrentLiableEarnings.FullTime
    }

    if(bStatus != null) {
      if(bStatus) {
        return EmploymentStatusType_ACC.TC_FULLTIME
      }
      return EmploymentStatusType_ACC.TC_PARTTIME
    }
    return null
  }
}
