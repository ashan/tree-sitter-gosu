package nz.co.acc.plm.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser

/**
 * Created by OurednM on 14/06/2018.
 */
class EmployeeRelationParser implements IFieldParser<AuthCompEmpRelation_ACC> {

  override function parse(text: String): Either<FieldValidationError, AuthCompEmpRelation_ACC> {
    var employeeRelation = AuthCompEmpRelation_ACC.get(text)
    if (employeeRelation == null) {
      return Either.left(new FieldValidationError("Invalid EmployeeRelation: ${text}"))
    } else {
      return Either.right(employeeRelation)
    }
  }
}