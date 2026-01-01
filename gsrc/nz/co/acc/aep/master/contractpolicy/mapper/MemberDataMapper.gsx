package nz.co.acc.aep.master.contractpolicy.mapper

uses entity.*
uses gw.api.financials.CurrencyAmount
uses nz.co.acc.aep.common.history.MembershipTerm
uses nz.co.acc.aep.util.CurrencyAmountUtil

uses java.math.BigDecimal

/**
 * Map data for AEPMemberData_ACC.
 */
enhancement MemberDataMapper: AEPMemberData_ACC {
  function  map(term : MembershipTerm) {
    this.ACCNumber = term.MemberACCNumber
    this.CompanyName = term.MemberAccount.AccountHolderContact.DisplayName
    this.ProductCode = term.ProductCode
    this.ProductName = term.ProductName
    this.PolicyNumber = term.PolicyNumber
    this.TermDaysForProration = term.TermDays
    this.NewAEPCustomer = term.NewAEPCustomer
    this.CeasedCustomerTrading = getCeasedFlag(term.PolicyNumber)
    mapData(term)

    //mapLiableEarningComponents(term)
  }
  private function getCeasedFlag(policyNumber:String) : boolean {
    return Policy.finder.findPolicyByPolicyNumber(policyNumber).LatestBoundPeriod.PolicyTerm.CeasedTradingDate_ACC != null
  }

  private function mapData(term: MembershipTerm) {
    var isFinalAudit = (this.Branch.Job typeis Audit)
    var policyLine = term.getRelevantPeriod(isFinalAudit).Period.Lines.first()
    if (policyLine typeis entity.EMPWPCLine) {
      mapCUDataForWPCLine(policyLine)
      mapLEComponentsForWPCLine(policyLine)
    }
    else if (policyLine typeis entity.CWPSLine) {
      mapCUDataForWPSLine(policyLine)
      mapLEComponentsForWPSLine(policyLine)
    }
    else
      throw "Unsupported policy line for mapping CU Data - ${policyLine.Subtype}"
  }

  private function mapCUDataForWPCLine(policyLine : entity.EMPWPCLine) {
    for (businessClassification in policyLine.BICCodes) {
      var cuData : AEPMemberCUData_ACC
      var existingCUDataForCUCode = this.AEPMemberCUData.firstWhere(\cud -> cud.CUCode == businessClassification.CUCode)
      if (existingCUDataForCUCode != null)
        cuData = existingCUDataForCUCode
      else
        cuData = new AEPMemberCUData_ACC(this.Branch)
      this.addToAEPMemberCUData(cuData)
      cuData.map(businessClassification)
    }
  }

  private function mapCUDataForWPSLine(policyLine : entity.CWPSLine) {
    var shareHolderEarningsList = policyLine.PolicyShareholders*.ShareholderEarnings
    for (shareHolderEarnings in shareHolderEarningsList) {
      var cuData : AEPMemberCUData_ACC
      var existingCUDataForCUCode = this.AEPMemberCUData.firstWhere(\cud -> cud.CUCode == shareHolderEarnings.CUCode)
      if (existingCUDataForCUCode != null)
        cuData = existingCUDataForCUCode
      else
        cuData = new AEPMemberCUData_ACC(this.Branch)
      this.addToAEPMemberCUData(cuData)
      cuData.map(shareHolderEarnings)
    }
  }

  private function mapLEComponentsForWPCLine(policyLine : entity.EMPWPCLine) {
    var liableEarnings = policyLine.EMPWPCCovs?.first()?.getLiableEarnings()
    if (liableEarnings == null)
      return
    var zero = CurrencyAmountUtil.ZERO_AMOUNT
    this.TotalGrossEarnings = liableEarnings.TotalGrossEarnings?.toCurrencyAmount() ?: zero
    this.TotalEarningsNotLiable = liableEarnings.TotalEarningsNotLiable?.toCurrencyAmount() ?: zero
    this.TotalPAYE = liableEarnings.TotalPAYE?.toCurrencyAmount() ?: zero
    this.TotalExcessPaid = liableEarnings.TotalExcessPaid?.toCurrencyAmount() ?: zero
    this.TotalLiableEarnings = liableEarnings.TotalLiableEarnings?.toCurrencyAmount() ?: zero
    this.AdjustedLiableEarnings = liableEarnings.RelevantAdjustedLEForAEP ?: zero
    this.AdjustedLiableEarningsLessCpx = this.AdjustedLiableEarnings
    this.PaymentForFirstWeek = liableEarnings.PaymentToEmployees?.toCurrencyAmount() ?: zero
    this.PaymentAfterFirstWeek = liableEarnings.PaymentAfterFirstWeek?.toCurrencyAmount() ?: zero
  }

  private function mapLEComponentsForWPSLine(policyLine : entity.CWPSLine) {
    var shareHolderEarningsList = policyLine.PolicyShareholders*.ShareholderEarnings
    var zero = CurrencyAmountUtil.ZERO_AMOUNT
    for (shareHolderEarnings in shareHolderEarningsList) {
      this.TotalGrossEarnings = (this.TotalGrossEarnings ?: zero) + (shareHolderEarnings.Remuneration?.toCurrencyAmount() ?: zero)
      this.TotalExcessPaid = (this.TotalExcessPaid ?: zero) + (shareHolderEarnings.ExcessMax?.toCurrencyAmount() ?: zero)
      this.TotalLiableEarnings = (this.TotalLiableEarnings ?: zero) + (shareHolderEarnings.LiableEarnings?.toCurrencyAmount() ?: zero)
      this.AdjustedLiableEarnings = (this.AdjustedLiableEarnings ?: zero) + (shareHolderEarnings.RelevantAdjustedLEForAEP ?: zero)
      this.AdjustedLiableEarningsLessCpx = (this.AdjustedLiableEarningsLessCpx ?: zero) + (shareHolderEarnings.RelevantAdjustedLELessCpxForAEP ?: zero)
      this.PaymentForFirstWeek = (this.PaymentForFirstWeek ?: zero) + (shareHolderEarnings.FirstWeek?.toCurrencyAmount() ?: zero)
    }
  }
}
