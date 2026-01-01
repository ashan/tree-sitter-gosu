package nz.co.acc.lob.shc

uses entity.*
uses gw.api.locale.DisplayKey
uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.lob.common.WPSTableEntity_ACC

uses java.math.BigDecimal

/**
 * Created by ManubaF on 15/03/2017.
 */
enhancement CWPSCovEnhancement: CWPSCov {

  function computeWorkAccountLevyCUCosts() : CWPSWorkAccountLevyCostItem[] {
    var cuItems = rollUpCUItems(this.WorkAccountLevyCosts.toList())
    this.WorkAccountLevyCosts = cuItems.toTypedArray()
    return this.WorkAccountLevyCosts
  }

  function computeResidualWorkAccountLevyCUCosts() : CWPSWorkAccountLevyCostItem[] {
    var cuItems = rollUpCUItems(this.ResidualWorkAccountLevyCosts.toList())
    this.ResidualWorkAccountLevyCosts = cuItems.toTypedArray()
    return this.ResidualWorkAccountLevyCosts
  }

  private function rollUpCUItems(cuItems : List<CWPSWorkAccountLevyCostItem>) : List<CWPSWorkAccountLevyCostItem> {

    // Remove all unecessary CUs
    var cuCodes = this.PolicyLine.BICCodes.map(\c -> c.CUCode).toSet()
    var removeCUs = cuItems.where(\elt -> !cuCodes.contains(elt.Code) and elt.CostType == WorkAccountLevyCostType_ACC.TC_CLASSIFICATIONUNIT)
    if(removeCUs.size() > 0) {
      for (cuToRemove in removeCUs) {
        cuItems.remove(cuToRemove)
        cuToRemove.removeWM()
      }
    }

    if(cuItems.size() > 0) {
      for (cuItem in cuItems) {
        cuItem.AdjustedLiableEarnings = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD).setScale(2)
        cuItem.LiableEarnings = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD).setScale(2)
        cuItem.LeLessSheOnCPX_ACC = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD).setScale(2)
      }
    }

    // iterate through all the shareholder earnings
    for (shareholderEarnings in this.CWPSLine.allShareholderEarnings()) {
      // Check if the cuItems already contains the CU Code
      var foundCU = cuItems.where(\elt -> elt.Code?.equals(shareholderEarnings?.CUCode))?.first()
      if (foundCU == null) {
        // Create a new CU Item
        // Convert the BIC Code to a work account cost item

        var cuCode = this.PolicyLine.BICCodes.where(\elt -> elt.CUCode?.equals(shareholderEarnings.CUCode))?.first()
        var cuItem = new CWPSWorkAccountLevyCostItem(this.PolicyLine.Branch)
        cuItem.Code                   = shareholderEarnings.CUCode
        cuItem.Description            = cuCode==null ? "" : cuCode.CUDescription
        cuItem.AdjustedLiableEarnings = shareholderEarnings.AdjustedLiableEarnings
        cuItem.LeLessSheOnCPX_ACC     = this.PolicyLine.JobType == typekey.Job.TC_AUDIT ?
                                        shareholderEarnings.AuditAdjustedLELessCpx :
                                        shareholderEarnings.AdjustedLELessCpx
        cuItem.LiableEarnings         = shareholderEarnings.LiableEarnings
        cuItem.CostType               = WorkAccountLevyCostType_ACC.TC_CLASSIFICATIONUNIT
        cuItems.add(cuItem)
      } else {
        foundCU.AdjustedLiableEarnings += shareholderEarnings.AdjustedLiableEarnings?:new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD).setScale(2)
        foundCU.LiableEarnings += shareholderEarnings.LiableEarnings?:new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD).setScale(2)
        foundCU.LeLessSheOnCPX_ACC = foundCU.LeLessSheOnCPX_ACC?:new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD).setScale(2)

        shareholderEarnings.AuditAdjustedLELessCpx = shareholderEarnings.AuditAdjustedLELessCpx?:new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD).setScale(2)
        shareholderEarnings.AdjustedLELessCpx = shareholderEarnings.AdjustedLELessCpx?:new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD).setScale(2)

        if (this.PolicyLine.JobType == typekey.Job.TC_AUDIT) {
          // Audit
          foundCU.LeLessSheOnCPX_ACC += shareholderEarnings.AuditAdjustedLELessCpx
        } else {
          // Not Audit
          foundCU.LeLessSheOnCPX_ACC += shareholderEarnings.AdjustedLELessCpx
        }
      }
    }
    return cuItems
  }

  property get ApplyInflationMessage() : String {
    if (this.ApplyInflation) {
      return DisplayKey.get("Web.Policy.CWPS.InflationAdjustmentMessage_ACC")
    }
    return null
  }

  function updateUIComponents() {
    for(shareholder in (this.PolicyLine as entity.CWPSLine).PolicyShareholders) {
      shareholder.computeAllShareholderEarnings()
    }
  }

  property get RemovedWALCUItems() : CWPSWorkAccountLevyCostItem[] {
    var auditSet = this.WorkAccountLevyCosts.map(\c -> c.Code).toSet()
    return this.BasedOn.WorkAccountLevyCosts.where(\elt -> !auditSet.contains(elt.Code))
  }

  property get RemovedRWALCUItems(): CWPSWorkAccountLevyCostItem[] {
    var auditSet = this.ResidualWorkAccountLevyCosts.map(\c -> c.Code).toSet()
    return this.BasedOn.ResidualWorkAccountLevyCosts.where(\elt -> !auditSet.contains(elt.Code))
  }

  property get WorkAccountLevyTableEntities(): WPSTableEntity_ACC[] {
    var walCostList = this.Branch.AllCosts.where(\elt -> elt.ChargePattern == ChargePattern.TC_WAL)
    var differenceCostList = this.BasedOn.Branch.AllCosts.where(\elt -> elt.ChargePattern == ChargePattern.TC_WAL).subtract(walCostList)
    var list = new ArrayList<WPSTableEntity_ACC>()

    for (finalCost in walCostList) {
      var shcCost = finalCost as SHCCost
      differenceCostList.remove(shcCost.BasedOn)
      list.add(new WPSTableEntity_ACC(shcCost, false))
    }

    for (provCost in differenceCostList) {
      var shcCost = provCost as SHCCost
      list.add(new WPSTableEntity_ACC(shcCost, true))
    }

    return list.toTypedArray()
  }

  property get ResidualWorkAccountLevyTableEntities(): WPSTableEntity_ACC[] {
    if (nz.co.acc.lob.common.DateUtil_ACC.isDatePriorACCWorkResidualLevyEndDate(this.EffectiveDate)) {
      var list = new ArrayList<WPSTableEntity_ACC>()
      var walCostList = this.Branch.AllCosts.where(\elt -> elt.ChargePattern == ChargePattern.TC_WARP)
      var differenceCostList = this.BasedOn.Branch.AllCosts.where(\elt -> elt.ChargePattern == ChargePattern.TC_WARP).subtract(walCostList)

      for (finalCost in walCostList) {
        var shcCost = finalCost as SHCCost
        differenceCostList.remove(shcCost.BasedOn)
        list.add(new WPSTableEntity_ACC(shcCost, false))
      }

      for (provCost in differenceCostList) {
        var shcCost = provCost as SHCCost
        list.add(new WPSTableEntity_ACC(shcCost, true))
      }

      return list.toTypedArray()
    }
    return null
  }
}
