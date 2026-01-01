package nz.co.acc.gwer.upload.parser

uses edge.util.either.Either
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.DateParser
uses nz.co.acc.gwer.upload.dto.ERClaimLiableEmployerUploadDTO
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser
uses java.math.BigDecimal

/*--- ER Upload Parsers ---*/
class ERClaimLiableEmployerUploadParser implements IRowParser<ERClaimLiableEmployerUploadDTO > {
  private final var dateParser = new DateParser()
  override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERClaimLiableEmployerUploadDTO> {
    try {
      var claimNumber = csvParser.nextString().trim().toOptional()
      var claimantACCNumber = csvParser.nextString().trim().toOptional()
      var claimantName = csvParser.nextString().trim().toOptional()
      var injuryDate = csvParser.nextString().trim().toOptional()
      var claimFundCode = csvParser.nextString().trim().toOptional()
      var claimFundDesc = csvParser.nextString().trim().toOptional()
      var acceptedDate = csvParser.nextString().trim().toOptional()
      var claimDesc = csvParser.nextString().trim().toOptional()
      var accidentLocation = csvParser.nextString().trim().toOptional()
      var coverDecision = csvParser.nextString().trim().toOptional()
      var isSensitive = csvParser.nextString().trim().toOptional()
      var isFatal = csvParser.nextString().trim().toOptional()
      var isGradualProcess = csvParser.nextString().trim().toOptional()
      var isAdverse = csvParser.nextString().trim().toOptional()
      var experienceYear = csvParser.nextString().trim().toOptional()
      var greatestModifiedDate = csvParser.nextString().trim().toOptional()
      var cntExpInjury = csvParser.nextString().trim().toOptional()
      var primaryCodingSystem = csvParser.nextString().trim().toOptional()
      var primaryInjuryCode = csvParser.nextString().trim().toOptional()
      var primaryInjuryDesc = csvParser.nextString().trim().toOptional()
      var accPolicyID_ACC = csvParser.nextString().trim().toOptional()
      var claimCUCode = csvParser.nextString().trim().toOptional()
      var percentLiable = csvParser.nextString().trim().toOptional()
      var totalWCD_Yr1 = csvParser.nextString().trim().toOptional()
      var totalWCD_Yr2 = csvParser.nextString().trim().toOptional()
      var totalWCD_Yr3 = csvParser.nextString().trim().toOptional()
      var medicalSpend_Yr1 = csvParser.nextString().trim().toOptional()
      var medicalSpend_Yr2 = csvParser.nextString().trim().toOptional()
      var medicalSpend_Yr3 = csvParser.nextString().trim().toOptional()

      var parseErrors = verifyPresenceOfMandatoryFields(claimNumber, experienceYear, claimFundCode)
      var dto = new ERClaimLiableEmployerUploadDTO()
      claimNumber.each(\value -> {dto.ClaimNumber = value})
      claimantACCNumber.each(\value -> {dto.ClaimantACCNumber = value})
      claimantName.each(\value -> {dto.ClaimantName = value.replace("&#44;",",")})
      parseField(parseErrors, dateParser, injuryDate, \parsedResult -> {
        dto.InjuryDate = parsedResult
      })
      claimFundCode.each(\value -> {dto.ClaimFundCode = value})
      claimFundDesc.each(\value -> {dto.ClaimFundDesc = value})
      parseField(parseErrors, dateParser, acceptedDate, \parsedResult -> {
        dto.AcceptedDate = parsedResult
      })
      claimDesc.each(\value -> {dto.ClaimDesc = value.replace("&#44;",",")})
      accidentLocation.each(\value -> {dto.AccidentLocation = value})
      coverDecision.each(\value -> {dto.CoverDecision = value})
      isSensitive.each(\value -> {dto.IsSensitive = Integer.valueOf(value)})
      isFatal.each(\value -> {dto.IsFatal = Integer.valueOf(value)})
      isGradualProcess.each(\value -> {dto.IsGradualProcess = Integer.valueOf(value)})
      isAdverse.each(\value -> {dto.IsAdverse = Integer.valueOf(value)})
      experienceYear.each(\value -> {
        dto.ExperienceYear = Integer.valueOf(value)
      })
      parseField(parseErrors, dateParser, greatestModifiedDate, \parsedResult -> {
        dto.GreatestModifiedDate = parsedResult
      })
      cntExpInjury.each(\value -> {dto.CntExpInjury = Integer.valueOf(value)})
      primaryCodingSystem.each(\value -> {dto.PrimaryCodingSystem = value})
      primaryInjuryCode.each(\value -> {dto.primaryInjuryCode = value})
      primaryInjuryDesc.each(\value -> {dto.PrimaryInjuryDesc = value})
      accPolicyID_ACC.each(\value -> {dto.ACCPolicyID_ACC = value})
      claimCUCode.each(\value -> {dto.ClaimCUCode = value})
      percentLiable.each(\value -> {dto.PercentLiable = new BigDecimal(value)})
      totalWCD_Yr1.each(\value -> {dto.TotalWCD_Yr1 = new BigDecimal(value)})
      totalWCD_Yr2.each(\value -> {dto.TotalWCD_Yr2 = new BigDecimal(value)})
      totalWCD_Yr3.each(\value -> {dto.TotalWCD_Yr3 = new BigDecimal(value)})
      medicalSpend_Yr1.each(\value -> {dto.MedicalSpend_Yr1 = new BigDecimal(value)})
      medicalSpend_Yr2.each(\value -> {dto.MedicalSpend_Yr2 = new BigDecimal(value)})
      medicalSpend_Yr3.each(\value -> {dto.MedicalSpend_Yr3 = new BigDecimal(value)})

      if (parseErrors.HasElements) {
        return Either.left(parseErrors)
      } else {
        return Either.right(dto)
      }
    } catch (e : NoSuchElementException) {
      return Either.left({new FieldValidationError("This row has missing fields. Check that you selected the correct Upload Type.")})
    } catch (e : Exception) {
      return Either.left({new FieldValidationError(e.toString())})
    }
  }

  /** Generic function to parse a single CSV field **/
  function parseField<FieldType>(
      fieldValidationErrors : List<FieldValidationError>,
      fieldParser : IFieldParser<FieldType>,
      csvInput : Optional<String>,
      fieldSetter(fieldValue : FieldType) : void) {

    if (csvInput.isPresent()) {
      var parseResult = fieldParser.parse(csvInput.get())
      if (parseResult.isLeft) {
        fieldValidationErrors.add(parseResult.left)
      } else {
        fieldSetter(parseResult.right)
      }
    }
  }

  private function verifyPresenceOfMandatoryFields(
      claimNumber : Optional<String>,
      experienceYear : Optional<String>,
      claimFundCode : Optional<String>) : List<FieldValidationError> {
    var errors : LinkedList<FieldValidationError> = {}
    if (!claimNumber.isPresent())
      errors.add(new FieldValidationError("ClaimNumber is required"))
    if (!experienceYear.isPresent())
      errors.add(new FieldValidationError("ExperienceYear is required"))
    if (!claimFundCode.isPresent())
      errors.add(new FieldValidationError("ClaimFundCode is required"))
    return errors
  }
}