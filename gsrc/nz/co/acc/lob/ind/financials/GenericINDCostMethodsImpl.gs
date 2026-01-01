package nz.co.acc.lob.ind.financials

@Export
class GenericINDCostMethodsImpl<T extends INDCost> implements INDCostMethods {

  protected var _owner: T as readonly Cost

  construct( owner: T ) {
    _owner = owner
  }

  override property get Coverage(): Coverage {
    return null
  }

  override property get OwningCoverable(): Coverable {
    return _owner.INDCoPLine
  }

  override property get Jurisdiction(): Jurisdiction {
    return _owner.INDCoPLine.BaseState
  }

}