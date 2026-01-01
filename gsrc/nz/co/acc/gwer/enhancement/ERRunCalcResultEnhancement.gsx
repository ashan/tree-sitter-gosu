package nz.co.acc.gwer.enhancement

uses gw.api.database.Query
uses entity.Contact
uses gw.api.database.Relop

uses java.math.BigDecimal

enhancement ERRunCalcResultEnhancement : ERRunCalcResult_ACC {


  property get MFPClaims() : String {
    return null
  }

  property get WCDClaims() : String {
    return null
  }

  property get FatalClaims() : String {
    return null
  }

  property get TotalUncappedWCD() : String {
    return null
  }

  property get TotalCappedWCD() : String {
    return null
  }

  function toStringArray() : String[] {
    var request = this.ERRun.ERRequest
    var requestTarget = this.ERRun.ERRequest.RequestTargets.where(\elt -> elt.ERBusinessGroup == this.ERBusinessGroup and elt.ACCPolicyID_ACC == this.ACCPolicyID_ACC).first()
    var levyPayerName = Query.make(entity.Contact).compare(Contact#ACCID_ACC, Relop.Equals, this.ACCPolicyID_ACC).select().FirstResult.DisplayName
    return {
      Long.toString(this.ERRun.ID.Value),
      Integer.toString(requestTarget.ERRequest.LevyYear),
      this.ERRun.ERRequest.ERRequestType.Name,
      requestTarget.ERRequestReason.Name,
      request.CreateTime.toISODate(),
      this.ACCPolicyID_ACC,
      levyPayerName,
      Long.toString(this.ERBusinessGroup.ID.Value),
      this.ERProgramme.Code,
      this.ERMod.toString(),

      this.IneligibleReason,
      this.LiableEarningsTotalYear1_amt.toString(),
      this.LiableEarningsTotalYear2_amt.toString(),
      this.LiableEarningsTotalYear3_amt.toString(),
      this.LiableEarningsTotal_amt.toString(),
      this.MFPClaims,
      this.WCDClaims,
      this.FatalClaims,
      this.TotalUncappedWCD,
      this.TotalCappedWCD,

      this.RequiresManualCalc.toString(),
      this.ManualCalcReason,
      this.ERManualCalcStatus.Name,
      this.ManualCalcERProgramme.Name,
      this.ManualCalcModifier.toString(),
      this.ManualEMod.toString(),
      this.ERRunCalcResultStatus.Name,
      this.PreOBAEMod.toString(),
      this.OBA.toString(),
      this.UncappedEMod.toString(),

      this.EMod.toString(),
      this.IMod.toString(),
      this.UncappedEModWeightedYear1.toString(),
      this.UncappedEModWeightedYear2.toString(),
      this.UncappedEModWeightedYear3.toString(),
      this.UncappedEModYear1.toString(),
      this.UncappedEModYear2.toString(),
      this.UncappedEModYear3.toString(),
      this.LevyDueTotalYear1_amt.toString(),
      this.LevyDueTotalYear2_amt.toString(),

      this.LevyDueTotalYear3_amt.toString(),
      this.StepAdjustment.toString(),
      this.IncludeInFactorYear1.toString(),
      this.IncludeInFactorYear2.toString(),
      this.IncludeInFactorYear3.toString(),
      this.ERCalculationType.Description
    }
  }
}
