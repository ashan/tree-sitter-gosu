package nz.co.acc.lob.aep.financials

@Export
class AEPCostMethodsImpl extends GenericAEPCostMethodsImpl<AEPCost_ACC> {

  construct(owner: entity.AEPCost_ACC) {
    super(owner)
  }

  override property get Jurisdiction(): Jurisdiction {
    return _owner.AEPLine.Branch.BaseState
  }

}