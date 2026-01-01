package nz.co.acc.plm.util

uses java.time.LocalTime
uses java.time.format.DateTimeFormatter

/**
 * Created by xcv on 7/03/21.
 */
enhancement LocalTimeEnhancement_ACC : LocalTime {

  function formatHourMinute_ACC() : String {
    return this.format(DateTimeFormatter.ofPattern("HH:mm"))
  }

}
