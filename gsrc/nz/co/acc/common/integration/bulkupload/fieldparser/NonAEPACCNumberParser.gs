package nz.co.acc.common.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.files.inbound.utils.InboundUtility
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError

uses java.util.regex.Pattern

/**
 * Created by Mike Ourednik on 23/01/2019.
 */
class NonAEPACCNumberParser implements IFieldParser<String> {
  final var aepPattern = Pattern.compile("PP([0][1-9]|[1][0-2])[2-9][0-9]{7}")

  override function parse(text: String): Either<FieldValidationError, String> {
    if (InboundUtility.isValidACCAccountNumberFormat(text)) {
      return Either.right(text)
    } else if (aepPattern.matcher(text).matches()) {
      return Either.left(new FieldValidationError("ACC number '${text}' not applicable. AEP accounts not covered by this tool"))
    } else {
      return Either.left(new FieldValidationError("ACC number '${text}' not valid"))
    }
  }
}