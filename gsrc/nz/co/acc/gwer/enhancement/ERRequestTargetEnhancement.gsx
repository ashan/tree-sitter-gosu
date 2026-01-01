package nz.co.acc.gwer.enhancement

uses nz.co.acc.gwer.businessgroup.BusinessGroupSearchResult_ACC
uses nz.co.acc.gwer.util.ERUIUtils_ACC

enhancement ERRequestTargetEnhancement : ERRequestTargetEntity_ACC {

  property get BusinessGroupID() : Long {
    if(this.ERBusinessGroup != null) {
      return this.ERBusinessGroup.ID.Value
    }
    return null
  }

  function updateFromSearchResult(result : BusinessGroupSearchResult_ACC) : ERBusinessGroup_ACC {
    this.ACCPolicyID_ACC = result.ACCPolicyID
    if(result.BusinessGroupID != null) {
      this.ERBusinessGroup = new ERUIUtils_ACC().getBusinessGroupByID(result.BusinessGroupID)
      return this.ERBusinessGroup
    }
    return null
  }
}
