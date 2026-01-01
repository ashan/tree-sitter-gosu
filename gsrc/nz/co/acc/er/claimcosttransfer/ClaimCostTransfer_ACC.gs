package nz.co.acc.er.claimcosttransfer

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses nz.co.acc.er.dbconnectionhandler.StoreProcController_ACC

uses java.io.Serializable

class ClaimCostTransfer_ACC implements Serializable {
  private var _storeProcController_ACC = new StoreProcController_ACC()

  function retrieveClaimCostTransfers(fromClaim : String, toClaim : String, accNumber : String) : ClaimCostTransferSearchResult_ACC[] {
    return _storeProcController_ACC.retrieveClaimCostTransfers(fromClaim, toClaim, accNumber)
  }

  public function deleteClaimCostTransfers(claimCostTransfersToDelete : ClaimCostTransferSearchResult_ACC[]) {
    claimCostTransfersToDelete.each(\elt -> _storeProcController_ACC.deleteClaimCostTransfer(elt))
  }

  public function updateClaimCostTransfer(claimCostTransferToUpdate : ClaimCostTransferSearchResult_ACC) {
    _storeProcController_ACC.updateClaimCostTransfer(claimCostTransferToUpdate)
  }

  public function validateModifyClaimCostTransfer(claimCostTransfer : ClaimCostTransferSearchResult_ACC) {
    if (!claimCostTransfer.ValidToClaim) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.ClaimCostTransfer.ToClaimInvalid_ACC"))
    }
    validateClaimCostTransfer(claimCostTransfer)
  }

  public function validateClaimCostTransfer(claimCostTransfer : ClaimCostTransferSearchResult_ACC) {
    var systemDate = Date.Today.trimToMidnight()
    if (claimCostTransfer.StartDate.trimToMidnight().after(systemDate)) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.ClaimCostTransfer.StartDateGreaterThanSystemDate_ACC"))
    }
    if (claimCostTransfer.StartDate.trimToMidnight().after(claimCostTransfer.EndDate.trimToMidnight())) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.ClaimCostTransfer.StartDateGreaterThanEndDate_ACC"))
    }
    if (claimCostTransfer.EndDate.trimToMidnight().after(systemDate)) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.ClaimCostTransfer.EndDateGreaterThanSystemDate_ACC"))
    }
    if (claimCostTransfer.EndDate.trimToMidnight().before(claimCostTransfer.StartDate.trimToMidnight())) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.ClaimCostTransfer.EndDatePriorToStartDate_ACC"))
    }
    if (claimCostTransfer.Description != null and claimCostTransfer.Description.length() > 255) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.ClaimCostTransfer.DescriptionTooLong_ACC"))
    }
  }

  public function createClaimCostTransfer(claimCostTransferToCreate : ClaimCostTransferSearchResult_ACC) {
    _storeProcController_ACC.createClaimCostTransfer(claimCostTransferToCreate)
  }

  public function refreshFromClaimCostTransferAccountDetails(claimCostTransferToRefresh : ClaimCostTransferSearchResult_ACC) {
    var claimDetail = _storeProcController_ACC.retrieveClaimCostTransferClaimDetails(claimCostTransferToRefresh.FromClaim, null)
    claimCostTransferToRefresh.FromClaimACCNumber = claimDetail.ACCNumber
    claimCostTransferToRefresh.FromClaimAccountName = claimDetail.AccountName
    claimCostTransferToRefresh.FromClaimACCPolicyID = claimDetail.ACCPolicyID
  }

  public function refreshToClaimCostTransferAccountDetails(claimCostTransferToRefresh : ClaimCostTransferSearchResult_ACC) {
    var claimDetail = _storeProcController_ACC.retrieveClaimCostTransferClaimDetails(null, claimCostTransferToRefresh.ToClaim)
    claimCostTransferToRefresh.ToClaimACCNumber = claimDetail.ACCNumber
    claimCostTransferToRefresh.ToClaimAccountName = claimDetail.AccountName
    claimCostTransferToRefresh.ToClaimACCPolicyID = claimDetail.ACCPolicyID
  }

  public function refreshClaimCostTransferDetails(claimCostTransferDetails : ClaimCostTransferSearchResult_ACC) : ClaimCostTransferSearchResult_ACC {
    var claims = this.retrieveClaimCostTransfers(claimCostTransferDetails.FromClaim, claimCostTransferDetails.ToClaim, claimCostTransferDetails.ACCNumber)
    return claims.where(\elt -> elt.ClaimCostTransferID == claimCostTransferDetails.ClaimCostTransferID)?.first()
  }
}