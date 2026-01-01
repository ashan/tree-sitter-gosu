package nz.co.acc.plm.integration.irbulk.inbound.nzbn

/**
 * Container / parser for IRD bulk inbound NZBN record
 * <p>
 * Created by OurednM on 13/02/2018.
 */
class NZBNRecord {

  var _sourceText: String as SourceText
  var _irdNumber: String as IRDNumber
  var _nzbn: String as NZBN

  private construct(sourceText: String, irdNumber: String, nzbn: String) {
    this._sourceText = sourceText
    this._irdNumber = irdNumber
    this._nzbn = nzbn
  }

  @Throws(InvalidNZBNRecordException, "if input is malformatted")
  public static function fromString(text: String): NZBNRecord {

    var tokens = text.trim().split("\\s+")
    if (tokens.length != 2) {
      throw new InvalidNZBNRecordException("Input string '${text}' contains ${tokens.length} tokens. Expected 2.")
    }

    final var irdNumber = tokens[0]
    final var nzbn = tokens[1]

    if (!irdNumber.Numeric) {
      throw new InvalidNZBNRecordException("IRD number '${irdNumber}' contains non-numeric characters")
    } else if (!nzbn.Numeric) {
      throw new InvalidNZBNRecordException("NZBN '${nzbn}' contains non-numeric characters")
    } else if (irdNumber.length < 8 || irdNumber.length > 9) {
      throw new InvalidNZBNRecordException("IRD number '${irdNumber}' should be 8 or 9 digits")
    } else if (nzbn.length != 13) {
      throw new InvalidNZBNRecordException("NZBN '${nzbn}' should be 13 digits")
    } else {
      return new NZBNRecord(text, irdNumber, nzbn)
    }
  }
}