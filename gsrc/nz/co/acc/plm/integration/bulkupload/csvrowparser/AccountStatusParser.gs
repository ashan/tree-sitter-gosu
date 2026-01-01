package nz.co.acc.plm.integration.bulkupload.csvrowparser

uses edge.util.either.Either
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.plm.integration.bulkupload.csvtypes.account.AccountStatusRow
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError

/**
 * Created by HamblyAl on 18/03/2019.
 */
class AccountStatusParser implements IRowParser<AccountStatusRow> {

  override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, AccountStatusRow> {
    var accNumber = csvParser.nextString().trim().toOptional()
    var suffix = csvParser.nextString().trim().toOptional()
    var accountStatus = csvParser.nextString().trim().toOptional()
    var parseErrors = validateRowData(accNumber, suffix, accountStatus)
    var accountStatusRow = new AccountStatusRow()
    accNumber.each(\value -> {
      accountStatusRow.ACCNumber = value
    })
    suffix.each(\value -> {
      accountStatusRow.Suffix = value
    })
    accountStatus.each(\value -> {
      accountStatusRow.AccountStatus = value
    })
    if (parseErrors.HasElements) {
      return Either.left(parseErrors)
    } else {
      return Either.right(accountStatusRow)
    }
  }

  private function validateRowData(accNumber : Optional<String>, suffix : Optional<String>, accountStatus : Optional<String>) : List<FieldValidationError> {
    var errors : LinkedList<FieldValidationError> = {}

    if (!accNumber.isPresent()) {
      errors.add(new FieldValidationError("ACC Number is required"))
    }

    if (!accountStatus.isPresent()) {
      errors.add(new FieldValidationError("Account Status is required"))
    }

    return errors
  }
}