package nz.co.acc.lob.emp.financials

@Export
class EMPCostMethodsImpl extends GenericEMPCostMethodsImpl<EMPCost> {

  construct(owner: entity.EMPCost) {
    super(owner)
  }

  override property get Jurisdiction(): Jurisdiction {
    return _owner.EMPWPCLine.Branch.BaseState
  }

}