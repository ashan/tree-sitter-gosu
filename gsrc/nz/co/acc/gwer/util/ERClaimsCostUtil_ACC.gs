package nz.co.acc.gwer.util

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.util.DisplayableException

class ERClaimsCostUtil_ACC {
  var fromClaimEmployer : ERClaimLiableEmployer_ACC
  var toClaimEmployer : ERClaimLiableEmployer_ACC
  var fromClaimAccount : Account
  var toClaimAccount : Account
  var _transfer : ERClaimCostTransfer_ACC

  construct(transfer : ERClaimCostTransfer_ACC) {
    _transfer = transfer
    if(transfer.SourceClaim.HasContent) {
      updateFromClaimEmployer(transfer.SourceClaim)
    }

    if(transfer.DestinationClaim.HasContent) {
      updateToClaimEmployer(transfer.DestinationClaim)
    }
  }

  property get IsFromEmployerWorkRelatedClaim() : Boolean {
    if(this.fromClaimEmployer != null) {
      return this.fromClaimEmployer.ERParamFundCode.ExperienceRatingInd
    } else {
      return Boolean.FALSE
    }
  }

  property get IsToEmployerWorkRelatedClaim() : Boolean {
    if(this.toClaimEmployer != null) {
      return this.toClaimEmployer.ERParamFundCode.ExperienceRatingInd
    } else {
      return Boolean.FALSE
    }
  }

  function getERLiableEmployer(claimNumber : String) : ERClaimLiableEmployer_ACC {
    return Query.make(ERClaimLiableEmployer_ACC)
                .compare(ERClaimLiableEmployer_ACC#ClaimNumber, Relop.Equals, claimNumber)
                .select().FirstResult
  }

  function updateFromClaimEmployer(claimNumber : String) {
    if(claimNumber.HasContent) {
      fromClaimEmployer = getERLiableEmployer(claimNumber)
      if(fromClaimEmployer != null) {
        fromClaimAccount = new ERProcessUtils_ACC().getLatestPolicyTermByACCPolicyID(fromClaimEmployer.ACCPolicyID_ACC).Policy.Account
      }
      _transfer.ACCPolicyID = fromClaimEmployer.ACCPolicyID_ACC
      _transfer.SourceEmployer = fromClaimEmployer
    } else {
      fromClaimEmployer = null
      fromClaimAccount = null
      _transfer.ACCPolicyID = null
      _transfer.SourceEmployer = null
    }
  }

  function updateToClaimEmployer(claimNumber : String) {
    if(claimNumber.HasContent) {
      toClaimEmployer = getERLiableEmployer(claimNumber)
      _transfer.DestinationEmplayer = toClaimEmployer
      if(toClaimEmployer != null) {
        toClaimAccount = new ERProcessUtils_ACC().getLatestPolicyTermByACCPolicyID(toClaimEmployer.ACCPolicyID_ACC).Policy.Account
      }
    } else {
      toClaimEmployer = null
      toClaimAccount = null
      _transfer.DestinationEmplayer = null
    }
  }

  property get fromClaimEmployerACCPolicyID() : String {
    if(fromClaimEmployer != null) {
      return fromClaimEmployer.ACCPolicyID_ACC
    }
    return null
  }

  property get fromClaimAccountACCID() : String {
    if(fromClaimAccount != null) {
      if(fromClaimEmployer != null and
          fromClaimEmployer.ERParamFundCode != null) {
        if(fromClaimEmployer.ERParamFundCode.ExperienceRatingInd) {
          return fromClaimAccount.ACCID_ACC
        } else {
          return "Non-work related"
        }
      }
    }
    return null
  }

  property get fromClaimAccountName() : String {
    if(fromClaimAccount != null) {
      return fromClaimAccount.AccountHolderContact.DisplayName
    }
    return null
  }

  property get toClaimEmployerACCPolicyID() : String {
    if(toClaimEmployer != null) {
      return toClaimEmployer.ACCPolicyID_ACC
    }
    return null
  }

  property get toClaimAccountACCID() : String {
    if(toClaimAccount != null) {
      if(toClaimEmployer != null and
          toClaimEmployer.ERParamFundCode != null) {
        if(toClaimEmployer.ERParamFundCode.ExperienceRatingInd) {
          return toClaimAccount.ACCID_ACC
        } else {
          return "Non-work related"
        }
      }
    }
    return null
  }

  property get toClaimAccountName() : String {
    if(toClaimAccount != null) {
      return toClaimAccount.AccountHolderContact.DisplayName
    }
    return null
  }

  function validateClaimsCostTransfer(claimsTransfer : ERClaimCostTransfer_ACC) {

    if(claimsTransfer.SourceClaim.HasContent) {
      var resultClaim = getERLiableEmployer(claimsTransfer.SourceClaim)
      if(resultClaim == null) {
        throw new DisplayableException("Source Claim number is invalid")
      }
    } else {
      throw new DisplayableException("No Source Claim number defined")
    }

    if(claimsTransfer.DestinationClaim.HasContent) {
      var resultClaim = getERLiableEmployer(claimsTransfer.DestinationClaim)
      if(resultClaim == null) {
        throw new DisplayableException("Destination Claim number is invalid")
      }
    } else {
      throw new DisplayableException("No Destination Claim number defined")
    }

  }
}