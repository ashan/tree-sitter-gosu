package nz.co.acc.lob.cpx.financials

@Export
class GenericCPXCostMethodsImpl<T extends CPXCost> implements CPXCostMethods {

  protected var _owner: T as readonly Cost

  construct( owner: T ) {
    _owner = owner
  }

  override property get Coverage(): Coverage {
    return null
  }

  override property get OwningCoverable(): Coverable {
    return _owner.INDCPXLine
  }

  override property get Jurisdiction(): Jurisdiction {
    return _owner.INDCPXLine.BaseState
  }

}