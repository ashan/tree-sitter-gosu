package nz.co.acc.common.integration.files.outbound.letter

uses gw.pl.currency.MonetaryAmount
uses gw.util.GosuStringUtil
uses nz.co.acc.plm.integration.files.outbound.OutboundConstants

uses java.math.BigDecimal

/**
 * Builds a line of delimiter-separated values
 * <p>
 * Created by Mike Ourednik on 13/11/2020.
 */
class MailhouseLineBuilder {
  final var _stringBuilder = new StringBuilder(512)
  final var _separator = "|"
  final var _newline = OutboundConstants.Newline

  public function append(field : String) : MailhouseLineBuilder {
    if (_stringBuilder.length() > 0) {
      _stringBuilder.append(_separator)
    }
    _stringBuilder.append(escapeCharacters(field))
    return this
  }

  public function append(field : String, maxLength : Integer) : MailhouseLineBuilder {
    return append(field?.truncate(maxLength))
  }

  public function appendShortDateFormat(date : Date) : MailhouseLineBuilder {
    var field = MailhouseFieldFormat.shortDateFormat(date)
    return append(field)
  }

  public function appendLongDateFormat(date : Date) : MailhouseLineBuilder {
    var field = MailhouseFieldFormat.longDateFormat(date)
    return append(field)
  }

  public function append(decimal : BigDecimal) : MailhouseLineBuilder {
    if (decimal == null) {
      return append("null")
    } else {
      var field = MailhouseFieldFormat.decimalFormat(decimal)
      return append(field)
    }
  }

  public function append(field : Integer) : MailhouseLineBuilder {
    return append(String.valueOf(field))
  }

  public function append(field : MonetaryAmount) : MailhouseLineBuilder {
    return append(field.Amount)
  }

  public function appendNewline() : MailhouseLineBuilder {
    _stringBuilder.append(_newline)
    return this
  }

  private function escapeCharacters(field : String) : String {
    if (field == null) {
      return null
    } else if (!GosuStringUtil.isBlank(field) and field.contains(_separator)) {
      return "\"${field}\""
    } else {
      return field
    }
  }

  override public function toString() : String {
    return _stringBuilder.toString()
  }

}