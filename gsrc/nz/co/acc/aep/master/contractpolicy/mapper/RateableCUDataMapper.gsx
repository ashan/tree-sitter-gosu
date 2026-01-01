package nz.co.acc.aep.master.contractpolicy.mapper

/**
 * Created by madhav.mandayam on 06-Jun-17.
 */
enhancement RateableCUDataMapper: AEPRateableCUData_ACC {
  function rollup(memberCUData : List<AEPMemberCUData_ACC>) {
    this.CUCode = memberCUData.first().CUCode
    this.CUDescription = memberCUData.first().CUDescription
    this.LiableEarnings = memberCUData.map(\elt -> elt.ProratedLiableEarnings).sum()
  }
}
