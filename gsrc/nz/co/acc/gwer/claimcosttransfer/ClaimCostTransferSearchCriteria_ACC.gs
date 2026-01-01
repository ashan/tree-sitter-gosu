package nz.co.acc.gwer.claimcosttransfer

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.database.Query
uses gw.api.util.DisplayableException
//uses nz.co.acc.erV2.dbconnectionhandler.ERDatabaseController_ACC

uses java.io.Serializable

class ClaimCostTransferSearchCriteria_ACC implements Serializable {
  private var _fromClaim : String as FromClaim
  private var _toClaim : String as ToClaim
  private var _accNumber : String as ACCNumber

  function performSearch() : ERClaimCostTransfer_ACC[] {
     if(this.FromClaim == null and this.ToClaim == null and this.ACCNumber == null) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.ClaimCostTransfer.SearchClaimCostTransfer_ACC.InsufficientSearchInfo_ACC"))
    }

    var claimsQuery = Query.make(ERClaimCostTransfer_ACC)

    if(this.FromClaim.HasContent) {
      claimsQuery.compare(ERClaimCostTransfer_ACC#SourceClaim, Relop.Equals, this.FromClaim)
    }

    if(this.ToClaim.HasContent) {
      claimsQuery.compare(ERClaimCostTransfer_ACC#DestinationClaim, Relop.Equals, this.ToClaim)
    }

    if(this.ACCNumber.HasContent) {
      claimsQuery.compare(ERClaimCostTransfer_ACC#ACCPolicyID, Relop.Equals, this.ACCNumber)
    }

    return claimsQuery.select().toTypedArray()
  }
}