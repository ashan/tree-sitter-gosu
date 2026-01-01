package nz.co.acc.lob.aep.financials

@Export
class GenericAEPCostMethodsImpl<T extends AEPCost_ACC> implements AEPCostMethods {

  protected var _owner: T as readonly Cost

  construct( owner: T ) {
    _owner = owner
  }

  override property get Coverage(): Coverage {
    return null
  }

  override property get OwningCoverable(): Coverable {
    return _owner.AEPLine
  }

  override property get Jurisdiction(): Jurisdiction {
    return null
  }

}