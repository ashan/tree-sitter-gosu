package nz.co.acc.plm.util

uses java.time.LocalDateTime
uses java.time.ZoneId

/**
 * Created by OurednM on 11/07/2018.
 */
enhancement LocalDateTimeEnhancement_ACC: LocalDateTime {

  function asDate(): Date {
    var zonedDateTime = this.atZone(ZoneId.of("Pacific/Auckland"))
    return Date.from(zonedDateTime.toInstant())
  }
}
