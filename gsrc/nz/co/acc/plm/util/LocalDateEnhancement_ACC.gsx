package nz.co.acc.plm.util

uses java.time.LocalDate

enhancement LocalDateEnhancement_ACC : LocalDate {

  function toDate(): Date {
    return java.sql.Date.valueOf(this)
  }

}
