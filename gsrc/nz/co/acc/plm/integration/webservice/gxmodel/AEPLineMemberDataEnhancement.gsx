package nz.co.acc.plm.integration.webservice.gxmodel

uses entity.AEPCost_ACC
uses entity.AEPMemberCUData_ACC

/**
 * Map Members CU data.
 */
enhancement AEPLineMemberDataEnhancement: AEPLine_ACC {
  property get MemberCUDetails(): AEPMemberCUData_ACC[] {
    return this.AEPMemberData*.AEPMemberCUData
        .where(\cuData -> cuData.AEPMemberData.TermDaysForProration > 0)
        .orderBy(\cuData -> cuData.AEPMemberData.ACCNumber)
        .thenBy(\cuData -> cuData.AEPMemberData.ProductCode)
        .thenBy(\cuData -> cuData.CUCode).toTypedArray()
  }

  property get AEPInvoiceCosts(): AEPCost_ACC[] {
    return this.AEPCosts.where(\elt -> !(elt typeis AEPAuditNegatedLevyCost_ACC or elt typeis AEPWorkAccountDiscountCost_ACC))
  }

}
