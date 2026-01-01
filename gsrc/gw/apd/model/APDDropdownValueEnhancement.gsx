package gw.apd.model

enhancement APDDropdownValueEnhancement : APDDropdownValue {
  property get HasValuePopulated() : Boolean {
    switch (this.DropdownColumn.ValueType) {
      case CovTermModelVal.TC_COUNT:
      case CovTermModelVal.TC_DAYS:
      case CovTermModelVal.TC_HOURS:
        if (this.IntegerValue == null) {
          return false
        }
        break
      case CovTermModelVal.TC_MONEY:
      case CovTermModelVal.TC_PERCENT:
      case CovTermModelVal.TC_OTHER:
        if (this.DecimalValue == null) {
          return false
        }
        break
      default:
        if (this.IntegerValue == null && this.DecimalValue == null) {
          return false
        }
    }
    return true
  }
}
