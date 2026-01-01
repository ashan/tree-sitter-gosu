package nz.co.acc.aep.master.contractpolicy.mapper

uses gw.api.util.DateUtil

uses java.math.RoundingMode

/**
 * Map data for AEPMemberCUData_ACC.
 */
enhancement MemberCUDataMapper: AEPMemberCUData_ACC {
  function map(businessClassification : PolicyLineBusinessClassificationUnit_ACC) {
    this.CUCode = businessClassification.CUCode
    this.CUDescription = businessClassification.CUDescription
    if (this.LiableEarnings != null)
      this.LiableEarnings += businessClassification.AdjustedLiableEarnings
    else
      this.LiableEarnings = businessClassification.AdjustedLiableEarnings
    var policyPeriod = businessClassification.Branch
    this.NewAEPCustomer = policyPeriod.NewAEPCustomer_ACC
    this.CeasedCustomerTrading = policyPeriod.CeasedTrading_ACC
    var prorationDays = this.AEPMemberData.TermDaysForProration
    if (prorationDays != null) {
      if(this.AEPMemberData.NewAEPCustomer or
         this.AEPMemberData.CeasedCustomerTrading) {
        this.ProratedLiableEarnings = this.LiableEarnings
      } else {
        this.ProratedLiableEarnings = ((this.LiableEarnings * prorationDays)/ NumberOfDaysInTerm)?.setScale(2, RoundingMode.HALF_UP)
      }
    }
  }

  function map(shareHolderEarnings : ShareholderEarnings_ACC) {
    this.CUCode = shareHolderEarnings.CUCode
    if (this.CUDescription == null) {
      this.CUDescription = shareHolderEarnings
          .ShareholderID.CWPSLine.BICCodes
          .firstWhere(\elt -> elt.CUCode == shareHolderEarnings.CUCode).CUDescription
    }
    if (this.LiableEarnings != null)
      this.LiableEarnings += shareHolderEarnings.RelevantAdjustedLELessCpxForAEP
    else
      this.LiableEarnings = shareHolderEarnings.RelevantAdjustedLELessCpxForAEP
    var policyPeriod = shareHolderEarnings.Branch
    this.NewAEPCustomer = policyPeriod.NewAEPCustomer_ACC
    this.CeasedCustomerTrading = policyPeriod.CeasedTrading_ACC
    var prorationDays = this.AEPMemberData.TermDaysForProration
    if (prorationDays != null) {
      if (this.AEPMemberData.NewAEPCustomer or
          this.AEPMemberData.CeasedCustomerTrading) {
        this.ProratedLiableEarnings = this.LiableEarnings
      } else {
        this.ProratedLiableEarnings = ((this.LiableEarnings * prorationDays) / NumberOfDaysInTerm)?.setScale(2, RoundingMode.HALF_UP)
      }
    }
  }

  private property get NumberOfDaysInTerm() : int {
    return DateUtil.differenceInDays(this.Branch.PeriodStart, this.Branch.PeriodEnd)
  }
}
