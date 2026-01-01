package nz.co.acc.aep.master.contractpolicy.ui

uses nz.co.acc.lob.common.AEPTableEntity_ACC

/**
 * Created by ManubaF on 3/07/2017.
 */
enhancement AEPLineLeviesEnhancement: AEPLine_ACC {
  property get WorkAccountLevyTableEntities(): AEPTableEntity_ACC[] {
    var walCostList = this.Branch.AllCosts.where(\elt -> elt typeis AEPWorkAccountLevyCost_ACC)
    var differenceCostList = this.BasedOn.Branch.AllCosts.where(\elt -> elt typeis AEPWorkAccountLevyCost_ACC).subtract(walCostList)
    return filterCosts(walCostList, differenceCostList)
  }

  property get ResidualWorkAccountLevyTableEntities(): AEPTableEntity_ACC[] {
    if (nz.co.acc.lob.common.DateUtil_ACC.isDatePriorACCWorkResidualLevyEndDate(this.EffectiveDate)) {
      return getCostsByChargePattern(ChargePattern.TC_WARP)
    }
    return null
  }

  property get PartnershipDiscountProgramme(): AEPTableEntity_ACC[] {
    var walCostList = this.Branch.AllCosts.where(\elt -> elt typeis AEPPartnershipPlanDiscountCost_ACC)
    var differenceCostList = this.BasedOn.Branch.AllCosts.where(\elt -> elt typeis AEPPartnershipPlanDiscountCost_ACC).subtract(walCostList)
    return filterCosts(walCostList, differenceCostList)
  }

  property get AuditDiscount(): AEPTableEntity_ACC[] {
    var walCostList = this.Branch.AllCosts.where(\elt -> elt typeis AEPAuditDiscountLevyCost_ACC)
    var differenceCostList = this.BasedOn.Branch.AllCosts.where(\elt -> elt typeis AEPAuditDiscountLevyCost_ACC).subtract(walCostList)
    return filterCosts(walCostList, differenceCostList)
  }

  function getCostsByChargePattern(chargePattern: ChargePattern): AEPTableEntity_ACC[] {
    var walCostList = this.Branch.AllCosts.where(\elt -> elt.ChargePattern == chargePattern)
    var differenceCostList = this.BasedOn.Branch.AllCosts.where(\elt -> elt.ChargePattern == chargePattern).subtract(walCostList)
    return rollUpCostsByCU(walCostList, differenceCostList)
  }

  function filterCosts(sourceCost: List<Cost>, diffCost: Set<Cost>): AEPTableEntity_ACC[] {
    return rollUpCostsByCU(sourceCost, diffCost)
  }

  private function rollUpCostsByCU(sourceFinalCosts:List<Cost>, sourceProvCosts:Set<Cost>):AEPTableEntity_ACC[] {
    var costs = new HashMap<String, AEPTableEntity_ACC>()
    var finalCosts = sourceFinalCosts.partition(\elt -> (elt as AEPCost_ACC).AEPRateableCUData.CUCode)
    var provCosts = sourceProvCosts.partition(\elt -> (elt as AEPCost_ACC).AEPRateableCUData.CUCode)

    finalCosts.eachKey(\cu -> {
      var finalCost = finalCosts.get(cu).first() as AEPCost_ACC
      var provCost = provCosts.get(cu)?.first() as AEPCost_ACC
      costs.put(cu, new AEPTableEntity_ACC(provCost, finalCost))
    })

    provCosts.eachKey(\cu -> {
      var finalCost = finalCosts.get(cu)?.first() as AEPCost_ACC
      var provCost = provCosts.get(cu).first() as AEPCost_ACC
      costs.put(cu, new AEPTableEntity_ACC(provCost, finalCost))
    })

    return costs.values().toTypedArray()
  }
}

