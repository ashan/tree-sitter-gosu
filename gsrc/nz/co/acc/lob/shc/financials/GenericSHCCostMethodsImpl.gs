package nz.co.acc.lob.shc.financials

@Export
class GenericSHCCostMethodsImpl<T extends SHCCost> implements SHCCostMethods {

  protected var _owner: T as readonly Cost

  construct( owner: T ) {
    _owner = owner
  }

  override property get Coverage(): Coverage {
    return null
  }

  override property get OwningCoverable(): Coverable {
    return _owner.CWPSLine
  }

  override property get Jurisdiction(): Jurisdiction {
    return _owner.CWPSLine.BaseState
  }

}