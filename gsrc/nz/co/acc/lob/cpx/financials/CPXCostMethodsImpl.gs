package nz.co.acc.lob.cpx.financials

@Export
class CPXCostMethodsImpl extends GenericCPXCostMethodsImpl<CPXCost> {

  construct(owner: entity.CPXCost) {
    super(owner)
  }

  override property get Jurisdiction(): Jurisdiction {
    return _owner.INDCPXLine.Branch.BaseState
  }

}