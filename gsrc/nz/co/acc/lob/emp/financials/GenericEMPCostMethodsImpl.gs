package nz.co.acc.lob.emp.financials

@Export
class GenericEMPCostMethodsImpl<T extends EMPCost> implements EMPCostMethods {

  protected var _owner: T as readonly Cost

  construct( owner: T ) {
    _owner = owner
  }

  override property get Coverage(): Coverage {
    return null
  }

  override property get OwningCoverable(): Coverable {
    return _owner.EMPWPCLine
  }

  override property get Jurisdiction(): Jurisdiction {
    return  _owner.EMPWPCLine.BaseState
  }

}