package nz.co.acc.gwer.datamigration

uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.AbstractBulkUploader
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor
uses nz.co.acc.common.integration.bulkupload.csvprocessor.CSVProcessorResult
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.DateParser
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.util.csv.CSVParser
uses edge.util.either.Either

uses java.util.concurrent.Executors
uses java.io.File
uses gw.pl.currency.MonetaryAmount
uses java.math.BigDecimal

class ER_DM_Load_ERRunCalcResult {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERRunCalcResult.csv")
    var bulkUploader : ERRunCalcResultBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERRunCalcResultBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
    })
    try {
      executor.submit(\-> bulkUploader.run())
    } catch (e : Exception) {
      print("Bulk uploader can not be scheduled for execution: "+e)
    }
    //shutdown ExecutorService
    executor.shutdown();
    while (!executor.isTerminated()) {   }
    System.out.println("Finished all ERBusinessGroup threads");
  }

  class ERRunCalcResultBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERRunCalcResultProcessor(new ERRunCalcResultUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERRunCalcResultUploadDTO {
    public var erID: Integer as ERID = null
    public var requestID: Integer as RequestID = null
    public var levyYear: Integer as LevyYear = null
    public var requestType: ERRequestType_ACC as ERRequestType = null
    public var requestGroupType: ERRequestGroupType_ACC as ERRequestGroupType = null
    public var runID: Integer as RunID = null
    public var accPolicyID: String as ACCPolicyID = null
    public var businessGroupID: String as BusinessGroupID = null
    public var calculationResultID: Integer as CalculationResultID = null
    public var calculationType: ERCalculationType_ACC as ERCalculationType = null
    public var programme: ERProgramme_ACC as ERProgramme = null
    public var liableEarningsTotal: MonetaryAmount as LiableEarningsTotal = null
    public var levyDueTotal: MonetaryAmount as LevyDueTotal = null
    public var wcdTotal: Float as WCDTotal = null
    public var requiresManualCalc: Boolean as RequiresManualCalc = null
    public var manualCalcProgramme: ERProgramme_ACC as ManualCalcERProgramme = null
    public var manualCalcReason: String as ManualCalcReason = null
    public var manualCalcStatus: ERManualCalcStatus_ACC as ERManualCalcStatus = null
    public var manualCalcModifier: Float as ManualCalcModifier = null
    public var ineligibleReason: String as IneligibleReason = null
    public var erSizeBand: String as ERSizeBand = null
    public var iMod: Float as IMod = null
    public var preOBAEMod: Float as PreOBAEMod = null
    public var oba: Float as OBA = null
    public var uncappedEMod: Float as UncappedEMod = null
    public var eMod: Float as EMod = null
    public var erMod: Float as ERMod = null
    public var isFatalTotal: Integer as IsFatalTotal = null
    public var includeInFactorYear1: Boolean as IncludeInFactorYear1 = null
    public var includeInFactorYear2: Boolean as IncludeInFactorYear2 = null
    public var includeInFactorYear3: Boolean as IncludeInFactorYear3 = null
    public var stepAdjustment: Integer as StepAdjustment = null
    public var levyDueTotalYear1: MonetaryAmount as LevyDueTotalYear1 = null
    public var levyDueTotalYear2: MonetaryAmount as LevyDueTotalYear2 = null
    public var levyDueTotalYear3: MonetaryAmount as LevyDueTotalYear3 = null
    public var uncappedEModYear1: Float as UncappedEModYear1 = null
    public var uncappedEModYear2: Float as UncappedEModYear2 = null
    public var uncappedEModYear3: Float as UncappedEModYear3 = null
    public var uncappedEModWeightedYear1: Float as UncappedEModWeightedYear1 = null
    public var uncappedEModWeightedYear2: Float as UncappedEModWeightedYear2 = null
    public var uncappedEModWeightedYear3: Float as UncappedEModWeightedYear3 = null
    public var manualEMod: Float as ManualEMod = null
    public var beforeAdj_ERMod: Float as BeforeAdj_ERMod = null
    public var isERModAdjCapped: Integer as IsERModAdjCapped = null
    public var resultStatusCode: ERRunCalcResultStatus_ACC as ERRunCalcResultStatus = null

    public override function toString(): String {
      return "ERRunCalcResultUploadDTO{" +
          "erID =" + erID + '' +
          ", requestID =" + requestID + '' +
          ", levyYear =" + levyYear + '' +
          ", requestType =" + requestType + '' +
          ", requestGroupType =" + requestGroupType + '' +
          ", runID =" + runID + '' +
          ", accPolicyID =" + accPolicyID + '' +
          ", businessGroupID =" + businessGroupID + '' +
          ", calculationResultID =" + calculationResultID + '' +
          ", calculationType ='" + calculationType + '\'' +
          ", programme ='" + programme + '\'' +
          ", liableEarningsTotal =" + liableEarningsTotal + '' +
          ", levyDueTotal =" + levyDueTotal + '' +
          ", wcdTotal =" + wcdTotal + '' +
          ", requiresManualCalc =" + requiresManualCalc + '' +
          ", manualCalcProgramme ='" + manualCalcProgramme + '\'' +
          ", manualCalcReason ='" + manualCalcReason + '\'' +
          ", manualCalcStatus ='" + manualCalcStatus + '\'' +
          ", manualCalcModifier =" + manualCalcModifier + '' +
          ", ineligibleReason ='" + ineligibleReason + '\'' +
          ", erSizeBand ='" + erSizeBand + '\'' +
          ", iMod =" + iMod + '' +
          ", preOBAEMod =" + preOBAEMod + '' +
          ", oba =" + oba + '' +
          ", uncappedEMod =" + uncappedEMod + '' +
          ", eMod =" + eMod + '' +
          ", erMod =" + erMod + '' +
          ", isFatalTotal =" + isFatalTotal + '' +
          ", includeInFactorYear1 =" + includeInFactorYear1 + '' +
          ", includeInFactorYear2 =" + includeInFactorYear2 + '' +
          ", includeInFactorYear3 =" + includeInFactorYear3 + '' +
          ", stepAdjustment =" + stepAdjustment + '' +
          ", levyDueTotalYear1 =" + levyDueTotalYear1 + '' +
          ", levyDueTotalYear2 =" + levyDueTotalYear2 + '' +
          ", levyDueTotalYear3 =" + levyDueTotalYear3 + '' +
          ", uncappedEModYear1 =" + uncappedEModYear1 + '' +
          ", uncappedEModYear2 =" + uncappedEModYear2 + '' +
          ", uncappedEModYear3 =" + uncappedEModYear3 + '' +
          ", uncappedEModWeightedYear1 =" + uncappedEModWeightedYear1 + '' +
          ", uncappedEModWeightedYear2 =" + uncappedEModWeightedYear2 + '' +
          ", uncappedEModWeightedYear3 =" + uncappedEModWeightedYear3 + '' +
          ", manualEMod =" + manualEMod + '' +
          ", beforeAdj_ERMod =" + beforeAdj_ERMod + '' +
          ", isERModAdjCapped =" + isERModAdjCapped + '' +
          ", resultStatusCode =" + resultStatusCode + '' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERRequestTypeParser implements IFieldParser<ERRequestType_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERRequestType_ACC> {
      var oTypeItem = ERRequestType_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Programme: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }
  class ERRequestGroupTypeParser implements IFieldParser<ERRequestGroupType_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERRequestGroupType_ACC> {
      var oTypeItem = ERRequestGroupType_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Programme: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }
  class ERCalculationTypeParser implements IFieldParser<ERCalculationType_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERCalculationType_ACC> {
      var oTypeItem = ERCalculationType_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Programme: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }
  class ERProgrammeParser implements IFieldParser<ERProgramme_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERProgramme_ACC> {
      var oTypeItem = ERProgramme_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Programme: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }
  class ERManualCalcStatusParser implements IFieldParser<ERManualCalcStatus_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERManualCalcStatus_ACC> {
      var oTypeItem = ERManualCalcStatus_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Programme: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }
  class ERRunCalcResultStatusParser implements IFieldParser<ERRunCalcResultStatus_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERRunCalcResultStatus_ACC> {
      var oTypeItem = ERRunCalcResultStatus_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Programme: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }

  class ERRunCalcResultUploadParser implements IRowParser<ERRunCalcResultUploadDTO> {
    private final var dateParser = new DateParser()
    private final var erRequestTypeParser = new ERRequestTypeParser()
    private final var erRequestGroupTypeParser = new ERRequestGroupTypeParser()
    private final var erCalculationTypeParser = new ERCalculationTypeParser()
    private final var erProgrammeParser = new ERProgrammeParser()
    private final var erManualCalcStatusParser = new ERManualCalcStatusParser()
    private final var erRunCalcResultStatusParser = new ERRunCalcResultStatusParser()

    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERRunCalcResultUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var requestID = csvParser.nextString().trim().toOptional()
        var levyYear = csvParser.nextString().trim().toOptional()
        var requestType = csvParser.nextString().trim().toOptional()
        var requestGroupType = csvParser.nextString().trim().toOptional()
        var runID = csvParser.nextString().trim().toOptional()
        var accPolicyID = csvParser.nextString().trim().toOptional()
        var businessGroupID = csvParser.nextString().trim().toOptional()
        var calculationResultID = csvParser.nextString().trim().toOptional()
        var calculationType = csvParser.nextString().trim().toOptional()
        var programme = csvParser.nextString().trim().toOptional()
        var liableEarningsTotal = csvParser.nextString().trim().toOptional()
        var levyDueTotal = csvParser.nextString().trim().toOptional()
        var wcdTotal = csvParser.nextString().trim().toOptional()
        var requiresManualCalc = csvParser.nextString().trim().toOptional()
        var manualCalcProgramme = csvParser.nextString().trim().toOptional()
        var manualCalcReason = csvParser.nextString().trim().toOptional()
        var manualCalcStatus = csvParser.nextString().trim().toOptional()
        var manualCalcModifier = csvParser.nextString().trim().toOptional()
        var ineligibleReason = csvParser.nextString().trim().toOptional()
        var erSizeBand = csvParser.nextString().trim().toOptional()
        var iMod = csvParser.nextString().trim().toOptional()
        var preOBAEMod = csvParser.nextString().trim().toOptional()
        var oba = csvParser.nextString().trim().toOptional()
        var uncappedEMod = csvParser.nextString().trim().toOptional()
        var eMod = csvParser.nextString().trim().toOptional()
        var erMod = csvParser.nextString().trim().toOptional()
        var isFatalTotal = csvParser.nextString().trim().toOptional()
        var includeInFactorYear1 = csvParser.nextString().trim().toOptional()
        var includeInFactorYear2 = csvParser.nextString().trim().toOptional()
        var includeInFactorYear3 = csvParser.nextString().trim().toOptional()
        var stepAdjustment = csvParser.nextString().trim().toOptional()
        var levyDueTotalYear1 = csvParser.nextString().trim().toOptional()
        var levyDueTotalYear2 = csvParser.nextString().trim().toOptional()
        var levyDueTotalYear3 = csvParser.nextString().trim().toOptional()
        var uncappedEModYear1 = csvParser.nextString().trim().toOptional()
        var uncappedEModYear2 = csvParser.nextString().trim().toOptional()
        var uncappedEModYear3 = csvParser.nextString().trim().toOptional()
        var uncappedEModWeightedYear1 = csvParser.nextString().trim().toOptional()
        var uncappedEModWeightedYear2 = csvParser.nextString().trim().toOptional()
        var uncappedEModWeightedYear3 = csvParser.nextString().trim().toOptional()
        var manualEMod = csvParser.nextString().trim().toOptional()
        var beforeAdj_ERMod = csvParser.nextString().trim().toOptional()
        var isERModAdjCapped = csvParser.nextString().trim().toOptional()
        var resultStatusCode = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(requestID, runID, calculationResultID, accPolicyID, businessGroupID)
        var dto = new ERRunCalcResultUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        requestID.each(\value -> {dto.RequestID = Integer.valueOf(value)})
        levyYear.each(\value -> {dto.LevyYear = Integer.valueOf(value)})
        parseField(parseErrors, erRequestTypeParser, requestType,
            \parsedResult -> {
              dto.ERRequestType = parsedResult
            })
        parseField(parseErrors, erRequestGroupTypeParser, requestGroupType,
            \parsedResult -> {
              dto.ERRequestGroupType = parsedResult
            })
        runID.each(\value -> {dto.RunID = Integer.valueOf(value)})
        accPolicyID.each(\value -> {dto.ACCPolicyID = value})
        businessGroupID.each(\value -> {dto.BusinessGroupID = value})
        calculationResultID.each(\value -> {dto.CalculationResultID = Integer.valueOf(value)
        })
        parseField(parseErrors, erCalculationTypeParser, calculationType,
            \parsedResult -> {
              dto.ERCalculationType = parsedResult
            })
        parseField(parseErrors, erProgrammeParser, programme,
            \parsedResult -> {
              dto.ERProgramme = parsedResult
            })
        liableEarningsTotal.each(\value -> {
          dto.LiableEarningsTotal = new BigDecimal(value).toMonetaryAmount()
        })
        levyDueTotal.each(\value -> {dto.LevyDueTotal = new BigDecimal(value).toMonetaryAmount()})
        wcdTotal.each(\value -> {dto.WCDTotal = Float.valueOf(value)
        })
        requiresManualCalc.each(\value -> {
          if(Integer.valueOf(value)==1) {
            dto.RequiresManualCalc = Boolean.TRUE
          } else {
            dto.RequiresManualCalc = Boolean.FALSE
          }
        })
        parseField(parseErrors, erProgrammeParser, manualCalcProgramme,
            \parsedResult -> {
              dto.ManualCalcERProgramme = parsedResult
            })
        manualCalcReason.each(\value -> {
          dto.ManualCalcReason = value
        })
        parseField(parseErrors, erManualCalcStatusParser, manualCalcStatus,
            \parsedResult -> {
              dto.ERManualCalcStatus = parsedResult
            })
        manualCalcModifier.each(\value -> {
          dto.ManualCalcModifier = Float.valueOf(value)
        })
        ineligibleReason.each(\value -> {dto.IneligibleReason = value})
        erSizeBand.each(\value -> {dto.ERSizeBand = value})
        iMod.each(\value -> {dto.IMod = Float.valueOf(value)})
        preOBAEMod.each(\value -> {
          dto.PreOBAEMod = Float.valueOf(value)
        })
        oba.each(\value -> {dto.OBA = Float.valueOf(value)})
        uncappedEMod.each(\value -> {dto.UncappedEMod = Float.valueOf(value)})
        eMod.each(\value -> {dto.EMod = Float.valueOf(value)})
        erMod.each(\value -> {
          dto.ERMod = Float.valueOf(value)
        })
        isFatalTotal.each(\value -> {dto.IsFatalTotal = Integer.valueOf(value)})
        includeInFactorYear1.each(\value -> {
          if(Integer.valueOf(value)==1) {
            dto.IncludeInFactorYear1 = Boolean.TRUE
          } else {
            dto.IncludeInFactorYear1 = Boolean.FALSE
          }
        })
        includeInFactorYear2.each(\value -> {
          if(Integer.valueOf(value)==1) {
            dto.IncludeInFactorYear2 = Boolean.TRUE
          } else {
            dto.IncludeInFactorYear2 = Boolean.FALSE
          }
        })
        includeInFactorYear3.each(\value -> {
          if(Integer.valueOf(value)==1) {
            dto.IncludeInFactorYear3 = Boolean.TRUE
          } else {
            dto.IncludeInFactorYear3 = Boolean.FALSE
          }
        })
        stepAdjustment.each(\value -> {dto.StepAdjustment = Integer.valueOf(value)})
        levyDueTotalYear1.each(\value -> {dto.LevyDueTotalYear1 = new BigDecimal(value).toMonetaryAmount()})
        levyDueTotalYear2.each(\value -> {dto.LevyDueTotalYear2 = new BigDecimal(value).toMonetaryAmount()})
        levyDueTotalYear3.each(\value -> {dto.LevyDueTotalYear3 = new BigDecimal(value).toMonetaryAmount()})
        uncappedEModYear1.each(\value -> {dto.UncappedEModYear1 = Float.valueOf(value)})
        uncappedEModYear2.each(\value -> {dto.UncappedEModYear2 = Float.valueOf(value)})
        uncappedEModYear3.each(\value -> {dto.UncappedEModYear3 = Float.valueOf(value)})
        uncappedEModWeightedYear1.each(\value -> {dto.UncappedEModWeightedYear1 = Float.valueOf(value)})
        uncappedEModWeightedYear2.each(\value -> {dto.UncappedEModWeightedYear2 = Float.valueOf(value)})
        uncappedEModWeightedYear3.each(\value -> {dto.UncappedEModWeightedYear3 = Float.valueOf(value)
        })
        manualEMod.each(\value -> {
          dto.ManualEMod = Float.valueOf(value)})
        beforeAdj_ERMod.each(\value -> {dto.BeforeAdj_ERMod = Float.valueOf(value)
        })
        isERModAdjCapped.each(\value -> {
          dto.IsERModAdjCapped = Integer.valueOf(value)
        })
        parseField(parseErrors, erRunCalcResultStatusParser, resultStatusCode,
            \parsedResult -> {
              dto.ERRunCalcResultStatus = parsedResult
            })

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
        requestID : Optional<String>,
        runID : Optional<String>,
        calculationResultID : Optional<String>,
        accPolicyID : Optional<String>,
        businessGroupID : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!requestID.isPresent())
        errors.add(new FieldValidationError("RequestID is required"))
      if (!runID.isPresent())
        errors.add(new FieldValidationError("RunID is required"))
      if (!calculationResultID.isPresent())
        errors.add(new FieldValidationError("CalculationResultID is required"))
      if (!accPolicyID.isPresent() and !businessGroupID.isPresent())
        errors.add(new FieldValidationError("Either ACCPolicyID or BusinessGroupID is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERRunCalcResultProcessor extends AbstractCSVProcessor<ERRunCalcResultUploadDTO> {
    construct(rowParser : IRowParser<ERRunCalcResultUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERRunCalcResultProcessor)
    }

    override function processRows(rows : List<ERRunCalcResultUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERRunCalcResults...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERRunCalcResult(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERRunCalcResult(lineNumber : int, dto : ERRunCalcResultUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERRunCalcResult_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERRunCalcResult_ACC()
          oEntity.PublicID = "er:"+dto.CalculationResultID
          if(dto.RunID != null) {
            var oERRun = getERRun("er:" + dto.RunID)
            if(oERRun != null) {
              oEntity.ERRun = oERRun
              oEntity.MostRecent = Boolean.TRUE
              oEntity.LevyYear_ACC = oERRun.ERRequest.LevyYear
            }
          }
          oEntity.ACCPolicyID_ACC = dto.ACCPolicyID
          if(dto.BusinessGroupID != null) {
            var oERBusinessGroup = getERBusinessGroup("er:" + dto.BusinessGroupID)
            if(oERBusinessGroup != null)
              oEntity.ERBusinessGroup = oERBusinessGroup
          }
          oEntity.ERCalculationType = dto.ERCalculationType
          oEntity.ERProgramme = dto.ERProgramme
          oEntity.LiableEarningsTotal = dto.LiableEarningsTotal
          oEntity.LevyDueTotal = dto.LevyDueTotal
          oEntity.WCDTotal = dto.WCDTotal
          oEntity.RequiresManualCalc = dto.RequiresManualCalc
          oEntity.ManualCalcERProgramme = dto.ManualCalcERProgramme
          oEntity.ManualCalcReason = dto.ManualCalcReason
          oEntity.ERManualCalcStatus = dto.ERManualCalcStatus
          oEntity.ManualEMod = dto.ManualCalcModifier
          oEntity.IneligibleReason = dto.IneligibleReason
          oEntity.ERSizeBand = dto.ERSizeBand
          oEntity.IMod = dto.IMod
          oEntity.PreOBAEMod = dto.PreOBAEMod
          oEntity.OBA = dto.OBA
          oEntity.UncappedEMod = dto.UncappedEMod
          oEntity.EMod = dto.EMod
          oEntity.ERMod = dto.ERMod
          oEntity.IsFatalTotal = dto.IsFatalTotal
          oEntity.IncludeInFactorYear1 = dto.IncludeInFactorYear1
          oEntity.IncludeInFactorYear2 = dto.IncludeInFactorYear2
          oEntity.IncludeInFactorYear3 = dto.IncludeInFactorYear3
          oEntity.StepAdjustment = dto.StepAdjustment
          oEntity.LevyDueTotalYear1 = dto.LevyDueTotalYear1
          oEntity.LevyDueTotalYear2 = dto.LevyDueTotalYear2
          oEntity.LevyDueTotalYear3 = dto.LevyDueTotalYear3
          oEntity.UncappedEModYear1 = dto.UncappedEModYear1
          oEntity.UncappedEModYear2 = dto.UncappedEModYear2
          oEntity.UncappedEModYear3 = dto.UncappedEModYear3
          oEntity.UncappedEModWeightedYear1 = dto.UncappedEModWeightedYear1
          oEntity.UncappedEModWeightedYear2 = dto.UncappedEModWeightedYear2
          oEntity.UncappedEModWeightedYear3 = dto.UncappedEModWeightedYear3
          oEntity.ManualEMod = dto.ManualEMod
          oEntity.BeforeAdj_ERMod = dto.BeforeAdj_ERMod
          oEntity.ERRunCalcResultStatus = dto.ERRunCalcResultStatus
          _log.info("${lineNumber}: Created ER Run Calculation Result")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Run Calculation Result failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
    private function getERRun(publicID : String) : ERRun_ACC {
      return Query.make(ERRun_ACC)
          .compareIgnoreCase(ERRun_ACC#PublicID, Relop.Equals, publicID)
          .select().AtMostOneRow
    }
    private function getERBusinessGroup(businessGroupID : String) : ERBusinessGroup_ACC {
      return Query.make(ERBusinessGroup_ACC)
          .compareIgnoreCase(ERBusinessGroup_ACC#BusinessGroupID, Relop.Equals, businessGroupID)
          .select().AtMostOneRow
    }
  }
}