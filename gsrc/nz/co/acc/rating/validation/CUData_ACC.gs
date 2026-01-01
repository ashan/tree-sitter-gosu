package nz.co.acc.rating.validation

/**
 * Contains the main CU data for comparison with the rate data.
 */
class CUData_ACC {
  private var _startDate : Date as StartDate
  private var _endDate : Date as EndDate
  private var _cuCode : String as CUCode

  construct(startDate : Date, endDate : Date, cuCode : String) {
    this.StartDate = startDate
    this.EndDate = endDate
    this.CUCode = cuCode
  }

  override function equals(object: Object): boolean {
    if (this === object) {
      return true
    }

    var that = object as CUData_ACC
    var result = StartDate.getTime() == that.StartDate.getTime() and EndDate.getTime() == that.EndDate.getTime() and CUCode.equals(that.CUCode)
    return result
  }

  override function hashCode(): int {
    return new org.apache.commons.lang.builder.HashCodeBuilder(7, 5)
        .append(super.hashCode())
        .append(StartDate)
        .append(EndDate)
        .append(CUCode)
        .toHashCode()
  }

  override public function toString() : String{
    return("Start Date : " + StartDate + "\n" +
        "End Date : " + EndDate + "\n" +
        "CU Code : " + CUCode
    )
  }
}