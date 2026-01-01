package nz.co.acc.aep

uses gw.api.util.DateUtil

enhancement AEPPolicyEnhancement: Policy {

  /**
   * Return True if the policy is active
   */
  property get Active_ACC(): boolean {
    return this.LatestPeriod.Active or
        (this.LatestPeriod.Status == TC_BOUND and
            this.LatestPeriod.CancellationDate == null and
            this.LatestPeriod.PeriodEnd > DateUtil.currentDate())
  }

  function isActiveForLevyYear_ACC(levyYear: Integer): boolean {
    var pp = this.getLatestPeriodForLevyYear_ACC(levyYear)
    return pp.Active or (pp.Status == TC_BOUND and not pp.Canceled)
  }

  property get IsAEPMemberPolicy_ACC(): boolean {
    return this.ProductCode != "AccreditedEmployersProgramme"
        and this.Account.AEPContractAccount_ACC
  }

  property get IsAEPMasterPolicy_ACC(): boolean {
    return this.ProductCode == "AccreditedEmployersProgramme"
        and this.Account.AEPContractAccount_ACC
  }

  property get AEPMasterPolicy_ACC(): Policy {
    return this.Account.AEPMasterPolicy_ACC
  }

  function getLatestPeriodForLevyYear_ACC(levyYear: Integer): PolicyPeriod {
    var period = getLatestBoundPeriodForLevyYear_ACC(levyYear)
    if (period == null) {
      period = this.Periods?.where(\p -> p.LevyYear_ACC == levyYear)
          ?.orderBy(\p -> p.CreateTime)
          ?.thenBy(\p -> p.UpdateTime)?.last()
    }
    return period
  }

  function getLatestBoundPeriodForLevyYear_ACC(levyYear: Integer): PolicyPeriod {
    return this.BoundPeriods
        ?.where(\p -> p.LevyYear_ACC == levyYear)
        ?.orderBy(\p -> p.CreateTime)
        ?.thenBy(\p -> p.UpdateTime)?.last()
  }

  function onHoldFromReassessment_ACC(levyYear: Integer = null): boolean {
    if (levyYear == null) {
      return this.LatestBoundPeriod.onHoldFromReassessment_ACC
    } else {
      return this.getLatestBoundPeriodForLevyYear_ACC(levyYear).onHoldFromReassessment_ACC
    }
  }

  public function findLatestBoundOrAuditedPeriod(levyYear: Integer = null): PolicyPeriod {
    var pp = this.Periods
        .where(\pp -> pp.LevyYear_ACC == levyYear and (pp.Status == PolicyPeriodStatus.TC_BOUND || pp.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE))
        .orderBy(\pp -> pp.ModelDate != null ? pp.ModelDate : pp.UpdateTime)
        .last()
    return pp
  }

}
