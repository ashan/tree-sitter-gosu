package nz.co.acc.common.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError

/**
 * Interface for processing a single CSV field.
 *
 * Created by OurednM on 18/06/2018.
 */
interface IFieldParser<FieldType> {
  function parse(text: String): Either<FieldValidationError, FieldType>
}