package nz.co.acc.lob.ind.financials

@Export
class INDCostMethodsImpl extends GenericINDCostMethodsImpl<INDCost> {

  construct(owner: entity.INDCost) {
    super(owner)
  }

  override property get Jurisdiction(): Jurisdiction {
    return _owner.INDCoPLine.Branch.BaseState
  }

}