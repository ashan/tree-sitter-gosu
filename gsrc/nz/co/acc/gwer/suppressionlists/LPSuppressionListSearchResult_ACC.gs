package nz.co.acc.gwer.suppressionlists

uses gw.api.database.Query
uses gw.api.database.Relop

class LPSuppressionListSearchResult_ACC {

  private var _suppressionListID : Integer as SuppressionListID

  private var _businessGroupId : Long as BusinessGroupID

  private var _accPolicyId : String as ACCPolicyID

  private var _levyPayerID : Integer as LevyPayerID

  private var _leverPayerName : String as LeverPayerName

  private var _recordCreated : Date as RecordCreated

  private var _recordCreatedBy : String as RecordCreatedBy

  private var _totalRows : int as TotalRows

  private var _businessGroupMember : ERBusinessGroupMember_ACC as BusinessGroupMember

  property get LevyPayerName() : String {
    if(BusinessGroupMember != null) {
      return _businessGroupMember.MemberAccountName
    } else {
      var accid = ACCPolicyID.substring(0, ACCPolicyID.length-1)
      return Query.make(Contact)
                  .compare(Contact#ACCID_ACC, Relop.Equals, accid).select().FirstResult.DisplayName
    }
  }
}