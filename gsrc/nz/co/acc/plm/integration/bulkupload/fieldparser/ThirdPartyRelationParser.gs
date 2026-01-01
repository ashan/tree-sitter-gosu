package nz.co.acc.plm.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser

/**
 * Created by OurednM on 14/06/2018.
 */
class ThirdPartyRelationParser implements IFieldParser<Auth3rdPartyRelations_ACC> {

  override function parse(text: String): Either<FieldValidationError, Auth3rdPartyRelations_ACC> {
    var thirdPartyRelation = Auth3rdPartyRelations_ACC.get(text)
    if (thirdPartyRelation == null) {
      return Either.left(new FieldValidationError("Invalid ThirdPartyRelation: ${text}"))
    } else {
      return Either.right(thirdPartyRelation)
    }
  }
}