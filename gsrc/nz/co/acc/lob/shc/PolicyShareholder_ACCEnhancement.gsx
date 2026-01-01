package nz.co.acc.lob.shc

uses gw.pl.currency.MonetaryAmount

/**
 * Created by ManubaF on 13/03/2017.
 */
enhancement PolicyShareholder_ACCEnhancement : PolicyShareholder_ACC {
  function initializeFields(policyPeriod : PolicyPeriod) {
    var shareholderEarnings = new ShareholderEarnings_ACC(policyPeriod)
    shareholderEarnings.initializeFields()
    this.addToShareholderEarnings(shareholderEarnings)
  }

  function computeAllShareholderEarnings() {
    for (shareholderEarnings in this.ShareholderEarnings) {
      shareholderEarnings.computeShareholderEarnings()
    }
  }

  function sumLiableEarnings() : MonetaryAmount {
    return this.ShareholderEarnings.sum(\x -> x.LiableEarnings)
  }

  function sumLiableEarningsLessCPX() : MonetaryAmount {
    return this.ShareholderEarnings.sum(\x -> x.AdjustedLELessCpx)
  }

  function sumAdjustedLiableEarnings() : MonetaryAmount {
    return this.ShareholderEarnings.sum(\x -> x.AdjustedLiableEarnings)
  }

  function sumAuditAdjustedLELessCpx() : MonetaryAmount {
    return this.ShareholderEarnings.sum(\x -> x.AuditAdjustedLELessCpx)
  }

  function sumAdjustedLELessCpx() : MonetaryAmount {
    return this.ShareholderEarnings.sum(\x -> x.AdjustedLELessCpx)
  }

  function sumRemuneration() : MonetaryAmount {
    return this.ShareholderEarnings.sum(\x -> x.Remuneration)
  }

  function anyShareholderEarningsMatchesCUCode(cuCode : String) : boolean {
    return this.ShareholderEarnings.hasMatch(\x -> x.CUCode?.equals(cuCode))
  }

  function removeAllShareholderEarnings() {
    for (shareholderEarnings in this.ShareholderEarnings) {
      shareholderEarnings.remove()
    }
  }

  function shareholderEarningsCount() : int {
    return this.ShareholderEarnings == null ? 0 : this.ShareholderEarnings.length
  }

  function addNewCPXBlankDetails(policyPeriod : PolicyPeriod) : PolicySHECPXDetails_ACC {
    var details = new PolicySHECPXDetails_ACC(policyPeriod)
    this.addToPolicySHECPXDetails(details)
    return details
  }

}
