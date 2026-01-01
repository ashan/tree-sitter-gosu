package nz.co.acc.gwer.enhancement

uses gw.api.database.Query
uses gw.api.database.Relop

enhancement ERSuppressionListEnhancement : ERSuppressionList_ACC {

  property get BusinessGroupID() : Long {
    var businessGrp = Query.make(ERPolicyMemberMap_ACC)
        .compare(ERPolicyMemberMap_ACC#ACCPolicyID, Relop.Equals, this.ACCPolicyID)
        .select().FirstResult.BusinessGroup

    if(businessGrp != null) {
      return businessGrp.ID.Value
    }

    return null
  }

  property get LevyPayerName() : String {
    if(this.ACCPolicyID != null) {
      return Query.make(Contact)
          .compare(Contact#ACCID_ACC, Relop.Equals, this.ACCPolicyID.substring(0, this.ACCPolicyID.length - 1))
          .select().FirstResult.DisplayName
    }
    return null
  }
}
