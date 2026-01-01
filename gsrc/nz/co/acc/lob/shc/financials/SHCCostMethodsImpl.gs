package nz.co.acc.lob.shc.financials

@Export
class SHCCostMethodsImpl extends GenericSHCCostMethodsImpl<SHCCost> {

  construct(owner: entity.SHCCost) {
    super(owner)
  }

  override property get Jurisdiction(): Jurisdiction {
    return _owner.CWPSLine.Branch.BaseState
  }

}