package nz.co.acc.plm.integration.irbulk.inbound.email

uses java.util.regex.Pattern

/**
 * Created by samarak on 30/11/2017.
 */
class EmailRecord {

  final static var TOKEN_COUNT = 5
  final static var EMAIL_PATTERN = Pattern.compile("^(([^<>()\\[\\]\\\\.,;:\\s@\"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@\"]+)*)|(\".+\"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$")
  final static var MAX_LENGTH = 50

  var _sourceRecord: String as readonly SourceRecord
  var _irdNumber: String as readonly IRDNumber
  var _firstEmailAddress: String as readonly FirstEmail
  var _myIREmailAddress: String as readonly MyIREmail

  @Throws(InvalidBulkEmailRecordException, "If record has invalid email address or unexpected number of delimited columns")
  construct(final line: String, final validateEmail: Boolean = false) {
    _sourceRecord = line
    parse(line, validateEmail)
  }

  private function parse(final line: String, final validateEmail: Boolean) {
    var tokens = line.split("\\|", -1).map(\elt -> elt.trim())

    if (tokens.length != 5) {
      throw new InvalidBulkEmailRecordException("Expected ${TOKEN_COUNT} tokens but found ${tokens.length}. Record=${line}")
    }

    if (validateEmail) {
      if (tokens[2].NotBlank and not isValidEmail(tokens[2])) {
        throw new InvalidBulkEmailRecordException("Invalid primary email address. Record=${line}")
      }

      if (tokens[3].NotBlank and not isValidEmail(tokens[3])) {
        throw new InvalidBulkEmailRecordException("Invalid secondary email address. Record=${line}")
      }
    }

    _irdNumber = tokens[0]
    // token[1] is 'name', and we ignore
    _firstEmailAddress = tokens[2]
    _myIREmailAddress = tokens[3]

    if (_firstEmailAddress.length > 50 || _myIREmailAddress.length > 50) {
      throw new InvalidBulkEmailRecordException("Record has email address with length > 50")
    }
    // token[4] is 'agent flag', and we ignore
  }

  private function isValidEmail(text: String): Boolean {
    return EMAIL_PATTERN.matcher(text).matches()
  }

}