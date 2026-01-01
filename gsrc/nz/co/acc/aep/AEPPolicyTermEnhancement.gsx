package nz.co.acc.aep

enhancement AEPPolicyTermEnhancement : PolicyTerm {

  function canPerformAEPAction_ACC(aepAction : AEPAction_ACC) : boolean {
    if (aepAction == null or this.AEPPhase_ACC == null) {
      return false
    } else {
      return aepAction.hasCategory(this.AEPPhase_ACC)
    }
  }

}
