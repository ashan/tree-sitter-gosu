package nz.co.acc.common.integration.files.outbound.letter

uses java.math.BigDecimal
uses java.text.DecimalFormat
uses java.text.SimpleDateFormat

/**
 * Created by Mike Ourednik on 16/11/2020.
 */
class MailhouseFieldFormat {
  static final var _shortDateFormat = new SimpleDateFormat("d MMMM yyyy") // format as  "5 April 2017"
  static final var _longDateFormat = new SimpleDateFormat("dd MMMM yyyy") // format as  "05 April 2017"
  static final var _fileEndOfRunDateFormat = new SimpleDateFormat("dd MMMM yyyy hh:mm:ss")
  static final var _decimalFormat = new DecimalFormat("0.00")

  static function shortDateFormat(date : Date): String {
    if (date == null) {
      return null
    }
    return _shortDateFormat.format(date)
  }

  static function longDateFormat(date : Date): String {
    return _longDateFormat.format(date)
  }

  static function fileEndOfRunDateFormat(date: Date): String {
    return _fileEndOfRunDateFormat.format(date)
  }

  static function decimalFormat(value: BigDecimal): String {
    return _decimalFormat.format(value)
  }

}