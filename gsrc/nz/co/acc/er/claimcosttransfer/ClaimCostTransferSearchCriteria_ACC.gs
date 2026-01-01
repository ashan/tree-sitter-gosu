package nz.co.acc.er.claimcosttransfer

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses nz.co.acc.er.dbconnectionhandler.ERDatabaseController_ACC

uses java.io.Serializable

class ClaimCostTransferSearchCriteria_ACC extends ERDatabaseController_ACC implements Serializable {
  private var _fromClaim : String as FromClaim
  private var _toClaim : String as ToClaim
  private var _accNumber : String as ACCNumber

  function performSearch() : ClaimCostTransferSearchResult_ACC[] {
    if(this.FromClaim == null and this.ToClaim == null and this.ACCNumber == null) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.ClaimCostTransfer.SearchClaimCostTransfer_ACC.InsufficientSearchInfo_ACC"))
    }
    var claimCostTransfer = new ClaimCostTransfer_ACC()
    return claimCostTransfer.retrieveClaimCostTransfers(this.FromClaim, this.ToClaim, this.ACCNumber)
  }
}