package nz.co.acc.plm.integration.bulkupload.csvrowparser

uses nz.co.acc.plm.integration.bulkupload.csvtypes.MigratedHold
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser
uses nz.co.acc.common.integration.bulkupload.fieldparser.LevyYearParser
uses nz.co.acc.common.integration.bulkupload.fieldparser.NonAEPACCNumberParser
uses nz.co.acc.plm.integration.bulkupload.fieldparser.ProductCodeParser

/**
 * Created by ChrisA on 01/10/2018 based on code written by MikeO for ContactParserUtil
 * US12192 process Migrated Policy Holds
 */
class MigratedHoldParserUtil {

  private final var accNumberParser = new NonAEPACCNumberParser()
  private final var productCodeParser = new ProductCodeParser()
  private final var levyYearParser = new LevyYearParser()

  /**
   * Generic function to parse a single CSV field
   *
   * @param fieldValidationErrors
   * @param fieldParser
   * @param csvInput
   * @param fieldSetter
   * @param <FieldType>
   */
  function parseField<FieldType>(
      fieldValidationErrors: List<FieldValidationError>,
      fieldParser: IFieldParser<FieldType>,
      csvInput: Optional<String>,
      fieldSetter(fieldValue: FieldType): void) {

    if (csvInput.isPresent()) {
      var parseResult = fieldParser.parse(csvInput.get())
      if (parseResult.isLeft) {
        fieldValidationErrors.add(parseResult.left)
      } else {
        fieldSetter(parseResult.right)
      }
    }
  }

  /**
   * Parses fields that are common between Person and Company contacts.
   *
   * @param accNumber
   * @param suffix
   * @param levyYear
   */
  function parseAndSetMigratedHoldFields(
      migratedHold: MigratedHold,
      fieldValidationErrors: List<FieldValidationError>,
      accNumber: Optional<String>,
      suffix: Optional<String>,
      levyYear: Optional<String>) {


    parseField(fieldValidationErrors, accNumberParser, accNumber,
        \parsedResult -> {
          migratedHold.ACCNumber = parsedResult
        })


    parseField(fieldValidationErrors, productCodeParser, suffix,
        \parsedResult -> {
          migratedHold.Suffix = parsedResult
        })

    parseField(fieldValidationErrors, levyYearParser, levyYear,
        \parsedResult -> {
          migratedHold.LevyYear = parsedResult
        })
  }

}

