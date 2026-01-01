package nz.co.acc.plm.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser
uses nz.co.acc.plm.integration.bulkupload.csvtypes.ContactType_ACC

/**
 * Created by OurednM on 14/06/2018.
 */
class ContactTypeParser implements IFieldParser<ContactType_ACC> {

  override function parse(text: String): Either<FieldValidationError, ContactType_ACC> {
    var contactType_acc = ContactType_ACC.valueOf(text)
    if (contactType_acc == null) {
      return Either.left(new FieldValidationError("Invalid contact type: ${text}"))
    } else {
      return Either.right(contactType_acc)
    }
  }
}