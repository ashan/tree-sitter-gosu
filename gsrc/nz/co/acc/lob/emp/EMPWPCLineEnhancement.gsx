package nz.co.acc.lob.emp

uses entity.*
uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.lob.common.WPCTableEntity_ACC

uses java.math.BigDecimal

enhancement EMPWPCLineEnhancement: entity.EMPWPCLine {

  function createAndAddEMPWPCCov(): EMPWPCCov {

    var cbl = new EMPWPCCov(this.Branch)
    cbl.setLiableEarningCov(new EMPLiableEarnings_ACC(this.Branch, this.EffectiveDate, this.ExpirationDate))
    this.addToEMPWPCCovs(cbl)
    cbl.syncModifiers()
    cbl.syncCoverages()
    return cbl
  }

  function removeEMPWPCCov(cbl: EMPWPCCov) {
    this.removeFromEMPWPCCovs( cbl )
  }

  property get WALTotalCostForAudit() : WPCTableEntity_ACC[] {
    var costToBeAdded = new ArrayList<EMPCost>()
    for(provCost in this.BasedOn.EMPCosts.where(\elt -> elt.ChargePattern == ChargePattern.TC_WAL)) {
      if(this.EMPCosts.where(\elt -> elt.BasedOn.CostKey == provCost.CostKey).HasElements == false) {
        costToBeAdded.add(provCost)
      }
    }

    var rwalCostList = this.EMPCosts.where(\elt -> elt.ChargePattern == ChargePattern.TC_WAL).toList()
//    var differenceCostList = this.BasedOn.Branch.AllCosts.where(\elt -> elt.ChargePattern == ChargePattern.TC_WAL).subtract(rwalCostList)
    var list = new ArrayList<WPCTableEntity_ACC>()

    for (finalCost in rwalCostList) {
      var empCost = finalCost as EMPCost
      list.add(new WPCTableEntity_ACC(empCost, false))
    }

    for (provCost in costToBeAdded) {
      var empCost = provCost as EMPCost
      list.add(new WPCTableEntity_ACC(empCost, true))
    }

    return list.toTypedArray()
  }

  property get RWALTotalCostForAudit() : WPCTableEntity_ACC[] {
    var rwalCostList = this.Branch.AllCosts.whereTypeIs(EMPResidualWorkAccountLevyItemCost).toList()
    var differenceCostList = this.BasedOn.Branch.AllCosts.whereTypeIs(EMPResidualWorkAccountLevyItemCost).subtract(rwalCostList)
    var list = new ArrayList<WPCTableEntity_ACC>()

    for (finalCost in rwalCostList) {
      differenceCostList.remove(finalCost.BasedOn)
      list.add(new WPCTableEntity_ACC(finalCost, false))
    }

    for (provCost in differenceCostList) {
      list.add(new WPCTableEntity_ACC(provCost, true))
    }

    return list.toTypedArray()
  }

  function updateModifiersBasedOnKeyword(searchString : String, exactMatch : boolean) {
    var discountAppliedModifiers = this.EMPLineModifiers.where(\elt -> elt.Pattern.CodeIdentifier.contains(searchString) == exactMatch)
    for (modifier in discountAppliedModifiers) {
      modifier.BooleanModifier = false
    }
  }

  function getSelectedDiscountAppliedModifier() : DiscountsAppliedSelection_ACC {
    if(hasSelectedModifier("WSD")) {
      return DiscountsAppliedSelection_ACC.TC_WSD
    } else if(hasSelectedModifier("WSMP")) {
      return DiscountsAppliedSelection_ACC.TC_WSMP
    }
    return null
  }

  function getSelectedExperienceRatingModifier() : EMPWPCLineMod {
    return this.EMPLineModifiers.where(\elt -> elt.Pattern.CodeIdentifier.equals("EMPWPCExpRatingProgramme")).first()
  }

  function hasSelectedExperienceRatingModifier() : Boolean {
    return getSelectedExperienceRatingModifier().TypeKeyModifier.HasContent
  }

  function hasSelectedModifier(searchString : String) : boolean {
    var discountModifiers = this.EMPLineModifiers.where(\elt -> elt.Pattern.CodeIdentifier.contains(searchString))
    for(modifier in discountModifiers) {
      if(modifier.BooleanModifier)
        return true
    }
    return false
  }

  function isPerson() : boolean {
    return this.Branch.Policy.Account.AccountHolderContact.Subtype == typekey.Contact.TC_PERSON
  }

  function initializeEMPModifiers() {
    for (modifiers in this.EMPLineModifiers) {
      if(modifiers.StartEndDate == null) {
        modifiers.StartEndDate = new StartEndDates_ACC(this.Branch)
      }
    }
  }

  function rollUpClassificationUnits_ACC() : EMPWPCRolledUpClassificationUnit_ACC[] {
    var cuItems = new ArrayList<EMPWPCRolledUpClassificationUnit_ACC>()
    for (bicCode in this.BICCodes) {
      // Check if the cuItems already contains the CU Code
      var foundCU = cuItems.where(\elt -> elt.CUCode?.equals(bicCode?.CUCode))?.first()
      if (foundCU == null) {
        // Create a new CU Item
        var cuCode = this.BICCodes.where(\elt -> elt.CUCode?.equals(bicCode?.CUCode))?.first()
        var cuItem = new EMPWPCRolledUpClassificationUnit_ACC()
        cuItem.CUCode                 = bicCode.CUCode
        cuItem.CUDescription          = cuCode == null ? "" : cuCode.CUDescription
        cuItem.Percentage             = bicCode.Percentage
        cuItem.AdjustedLiableEarnings = new MonetaryAmount(bicCode.AdjustedLiableEarnings.Amount, Currency.TC_NZD).setScale(2)
        cuItems.add(cuItem)
      } else {
        foundCU.Percentage += bicCode.Percentage
        foundCU.AdjustedLiableEarnings += new MonetaryAmount(bicCode.AdjustedLiableEarnings.Amount, Currency.TC_NZD)?:new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD).setScale(2)
      }
    }
    return cuItems.toTypedArray()
  }

  function typeKeyModifiersAsList() : List<String> {
    var typeKeyModifierList = new ArrayList<String>()
    var productModifiers = this.EMPLineModifiers
    if (productModifiers != null) {
      for (productModifier in productModifiers) {
        if (productModifier.TypeKeyModifier != null) { // exclude nulls
          typeKeyModifierList.add(productModifier.TypeKeyModifier)
        }
      }
    }
    return typeKeyModifierList
  }

  function getTotalLiableEarningsByCUCode(cuCode : String) : BigDecimal {
    var matchBICCodes = this.BICCodes.where(\elt -> elt.CUCode.equals(cuCode))
    if(matchBICCodes.HasElements) {
      return matchBICCodes.sum(\elt -> elt.AdjustedLiableEarnings).Amount
    }
    return BigDecimal.ZERO
  }
}