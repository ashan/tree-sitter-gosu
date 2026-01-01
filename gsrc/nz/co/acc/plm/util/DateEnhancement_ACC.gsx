package nz.co.acc.plm.util

/**
 * Created by OurednM on 10/07/2018.
 */
enhancement DateEnhancement_ACC: Date {

  property get LevyYear_ACC(): Integer {
    var offsetDate = this.addMinutes(-1)
    if (offsetDate.MonthOfYear >= 4) {
      return offsetDate.YearOfDate + 1
    } else {
      return offsetDate.YearOfDate
    }
  }

  public function toISODate() : String {
    return this.toStringWithFormat("yyyy-MM-dd")
  }

  public function toISOTimestamp(): String {
    return this.toStringWithFormat("yyyy-MM-dd'T'HH:mm:ss.SSS")
  }

}
