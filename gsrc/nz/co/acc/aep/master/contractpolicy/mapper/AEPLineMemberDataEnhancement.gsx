package nz.co.acc.aep.master.contractpolicy.mapper

uses gw.api.financials.CurrencyAmount
uses nz.co.acc.aep.common.history.MembershipHistory
uses nz.co.acc.aep.common.history.MembershipTerm
uses nz.co.acc.aep.util.CurrencyAmountUtil

/**
 * Map Member and Rateable CU data.
 */
enhancement AEPLineMemberDataEnhancement: AEPLine_ACC {
  function createAndMapAEPMemberAndRateableData_ACC() {
    createAndMapAEPMemberData_ACC()
    createAndMapRateableCUData_ACC()
  }

  public function clearExistingAEPMemberData_ACC() {
    this.AEPMemberData.each(\memberData -> {
      this.removeFromAEPMemberData(memberData)
    })
  }

  public function clearExistingAEPRateableCUData_ACC() {
    this.AEPRateableCUData.each(\rateableCUData -> {
      this.removeFromAEPRateableCUData(rateableCUData)
    })
  }

  private function createAndMapAEPMemberData_ACC() {
    var account = this.Branch.Policy.Account
    var membershipHistory = MembershipHistory.withTermsFor(account, this.Branch.PeriodEnd.YearOfDate)
    var orderedTerms = membershipHistory.Terms.orderBy(\elt -> elt.StartDate)
    for (term in orderedTerms) {
      if(term.TermDays > 0) {
        var memberData = new AEPMemberData_ACC(this.Branch)
        memberData.map(term)
        this.addToAEPMemberData(memberData)
      }
    }
  }

  private function createAndMapRateableCUData_ACC() {
    var memberCUDataList = this.AEPMemberData*.AEPMemberCUData.where(\elt -> elt.AEPMemberData.TermDaysForProration>0)
    if (!memberCUDataList.HasElements)
      return

    var memberCUDataGroupedByCUCode = memberCUDataList.partition(\cuData -> cuData.CUCode)
    memberCUDataGroupedByCUCode.eachKey(\cuCode -> {
      var aepRateableCUData = new AEPRateableCUData_ACC(this.Branch)
      aepRateableCUData.rollup(memberCUDataGroupedByCUCode.get(cuCode))
      this.addToAEPRateableCUData(aepRateableCUData)
    })
  }

  private function getLatestSegmentOfPolicyListForMemberData_ACC() : List<AEPMemberData_ACC> {
    var groupedMemberData = this.AEPMemberData.partition(\md -> md.ACCNumber + ";" + md.ProductCode)
    var memberDataList = new ArrayList<AEPMemberData_ACC>()
    groupedMemberData.eachKey(\k -> {
      var latestSegment = groupedMemberData.get(k).orderBy(\elt -> elt.ID).last()
      memberDataList.add(latestSegment)
    })
    return memberDataList
  }

  property get TotalGrossEarnings() : CurrencyAmount {
    return getLatestSegmentOfPolicyListForMemberData_ACC().map(\m -> m.TotalGrossEarnings?:CurrencyAmountUtil.ZERO_AMOUNT).sum()
  }

  property get TotalEarningsNotLiable() : CurrencyAmount {
    return getLatestSegmentOfPolicyListForMemberData_ACC().map(\m -> m.TotalEarningsNotLiable?:CurrencyAmountUtil.ZERO_AMOUNT).sum()
  }

  property get TotalPAYE() : CurrencyAmount {
    return getLatestSegmentOfPolicyListForMemberData_ACC().map(\m -> m.TotalPAYE?:CurrencyAmountUtil.ZERO_AMOUNT).sum()
  }

  property get TotalExcessPaid() : CurrencyAmount {
    return getLatestSegmentOfPolicyListForMemberData_ACC().map(\m -> m.TotalExcessPaid?:CurrencyAmountUtil.ZERO_AMOUNT).sum()
  }

  property get TotalLiableEarnings() : CurrencyAmount {
    return getLatestSegmentOfPolicyListForMemberData_ACC().map(\m -> m.TotalLiableEarnings?:CurrencyAmountUtil.ZERO_AMOUNT).sum()
  }

  property get AdjustedLiableEarnings() : CurrencyAmount {
    return this.AEPRateableCUData.map(\cuData -> cuData.LiableEarnings).sum()
  }

  property get PaymentForFirstWeek() : CurrencyAmount {
    return getLatestSegmentOfPolicyListForMemberData_ACC().map(\m -> m.PaymentForFirstWeek?:CurrencyAmountUtil.ZERO_AMOUNT).sum()
  }

  property get PaymentAfterFirstWeek() : CurrencyAmount {
    return getLatestSegmentOfPolicyListForMemberData_ACC().map(\m -> m.PaymentAfterFirstWeek?:CurrencyAmountUtil.ZERO_AMOUNT).sum()
  }
}
