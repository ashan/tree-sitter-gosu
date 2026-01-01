package nz.co.acc.lob.ind

uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC

uses java.math.BigDecimal

enhancement INDCoPLineEnhancement: entity.INDCoPLine {

  function createAndAddINDCoPCov(): INDCoPCov {
    var cbl = new INDCoPCov(this.Branch)

    var liableEarnings = new INDLiableEarnings_ACC(this.Branch)
    LiableEarningsUtilities_ACC.resetINDCoPLiableEarnings(liableEarnings)
    cbl.setLiableEarningCov(liableEarnings)

    var actualLiableEarnings = new INDLiableEarnings_ACC(this.Branch)
    LiableEarningsUtilities_ACC.resetINDCoPLiableEarnings(actualLiableEarnings)
    cbl.setActualLiableEarningsCov(actualLiableEarnings)

    this.addToINDCoPCovs(cbl)
    cbl.syncModifiers()
    cbl.syncCoverages()
    return cbl
  }

  function removeINDCoPCov(cbl: INDCoPCov) {
    this.removeFromINDCoPCovs( cbl )
  }

  property get WorkAccountLevyCosts() : List<INDCost> {
    var list = new ArrayList<INDCost>()
    list.addAll(this.INDCoPCovs.first().INDCoPWorkAccountLevyCosts.toList())
    list.addAll(this.INDCoPModifierCosts.toList())
    return list
  }

  function totalLiableEarningsNotZeroAndChanged() : boolean {
    if(this.AssociatedPolicyPeriod.IsNewLERuleAppliedYear) {
      return this.INDCoPCovs.first()?.ActualLiableEarningsCov?.AdjustedLiableEarnings?.Amount != BigDecimal.ZERO and
             this.INDCoPCovs.first()?.ActualLiableEarningsCov.isFieldChangedFromBasedOn("AdjustedLiableEarnings")
    } else {
      return this.INDCoPCovs.first()?.LiableEarningCov?.AdjustedLiableEarnings?.Amount != BigDecimal.ZERO and
             this.INDCoPCovs.first()?.LiableEarningCov.isFieldChangedFromBasedOn("AdjustedLiableEarnings")
    }
  }

  function totalLENotZeroAndChanged(isActual:boolean) : boolean {
    if(isActual) {
      return this.INDCoPCovs.first()?.ActualLiableEarningsCov?.AdjustedLiableEarnings?.Amount != BigDecimal.ZERO and
          this.INDCoPCovs.first()?.ActualLiableEarningsCov.isFieldChangedFromBasedOn("AdjustedLiableEarnings")
    } else {
      return this.INDCoPCovs.first()?.LiableEarningCov?.AdjustedLiableEarnings?.Amount != BigDecimal.ZERO and
          this.INDCoPCovs.first()?.LiableEarningCov.isFieldChangedFromBasedOn("AdjustedLiableEarnings")
    }
  }

  property get CurrentFullTimeEmploymentStatus() : Boolean {
    if (this.AssociatedPolicyPeriod.IsNewLERuleAppliedYear) {
      return this.INDCoPCovs.first()?.ActualLiableEarningsCov?.FullTime
    } else {
      return this.INDCoPCovs.first()?.LiableEarningCov?.FullTime
    }
  }

}