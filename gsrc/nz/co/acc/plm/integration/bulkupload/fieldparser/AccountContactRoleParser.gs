package nz.co.acc.plm.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser
uses typekey.AccountContactRole

/**
 * Created by OurednM on 14/06/2018.
 */
class AccountContactRoleParser implements IFieldParser<AccountContactRole> {

  override function parse(text: String): Either<FieldValidationError, AccountContactRole> {
    var accountContactRole = AccountContactRole.get(text)
    if (accountContactRole == null) {
      return Either.left(new FieldValidationError("Invalid account contact role: ${text}"))
    } else {
      return Either.right(accountContactRole)
    }
  }
}