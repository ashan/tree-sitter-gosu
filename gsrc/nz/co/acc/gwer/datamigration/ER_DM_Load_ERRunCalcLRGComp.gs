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
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.util.csv.CSVParser
uses edge.util.either.Either

uses java.util.concurrent.Executors
uses java.io.File
uses gw.pl.currency.MonetaryAmount
uses java.math.BigDecimal

class ER_DM_Load_ERRunCalcLRGComp {
  private static var _erProcessUtils = new ERProcessUtils_ACC()

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERRunCalcLRGComp.csv")
    var bulkUploader : ERRunCalcLRGCompBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERRunCalcLRGCompBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERRunCalcLRGCompBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERRunCalcLRGCompProcessor(new ERRunCalcLRGCompUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERRunCalcLRGCompUploadDTO {
    public var erID: Integer as ERID = null
    public var calculationResultID: Integer as CalculationResultID = null
    public var lrgCode: Integer as LRGCode = null
    public var lrgLiableEarningTotal: MonetaryAmount as LRGLiableEarningTotal = null
    public var lrgLiableEarningTotalYear1: MonetaryAmount as LRGLiableEarningTotalYear1 = null
    public var lrgLiableEarningTotalYear2: MonetaryAmount as LRGLiableEarningTotalYear2 = null
    public var lrgLiableEarningTotalYear3: MonetaryAmount as LRGLiableEarningTotalYear3 = null
    public var lrgLevyDueTotal: MonetaryAmount as LRGLevyDueTotal = null
    public var lrgLevyDueTotalYear1: MonetaryAmount as LRGLevyDueTotalYear1 = null
    public var lrgLevyDueTotalYear2: MonetaryAmount as LRGLevyDueTotalYear2 = null
    public var lrgLevyDueTotalYear3: MonetaryAmount as LRGLevyDueTotalYear3 = null
    public var lrgRiskMgmtClaimsTotal: Float as LRGRiskMgmtClaimsTotal = null
    public var lrgRiskMgmtClaimsTotalYear1: Float as LRGRiskMgmtClaimsTotalYear1 = null
    public var lrgRiskMgmtClaimsTotalYear2: Float as LRGRiskMgmtClaimsTotalYear2 = null
    public var lrgRiskMgmtClaimsTotalYear3: Float as LRGRiskMgmtClaimsTotalYear3 = null
    public var lrgWCDTotal: Float as LRGWCDTotal = null
    public var lrgWCDTotalYear1: Float as LRGWCDTotalYear1 = null
    public var lrgWCDTotalYear2: Float as LRGWCDTotalYear2 = null
    public var lrgWCDTotalYear3: Float as LRGWCDTotalYear3 = null
    public var lrgActualRehabMgmtRate: Float as LRGActualRehabMgmtRate = null
    public var lrgActualRehabMgmtRateYear1: Float as LRGActualRehabMgmtRateYear1 = null
    public var lrgActualRehabMgmtRateYear2: Float as LRGActualRehabMgmtRateYear2 = null
    public var lrgActualRehabMgmtRateYear3: Float as LRGActualRehabMgmtRateYear3 = null
    public var lrgActualRiskMgmtRate: Float as LRGActualRiskMgmtRate = null
    public var lrgActualRiskMgmtRateYear1: Float as LRGActualRiskMgmtRateYear1 = null
    public var lrgActualRiskMgmtRateYear2: Float as LRGActualRiskMgmtRateYear2 = null
    public var lrgActualRiskMgmtRateYear3: Float as LRGActualRiskMgmtRateYear3 = null
    public var lrgExpectedRehabMgmtRate: Float as LRGExpectedRehabMgmtRate = null
    public var lrgExpectedRehabMgmtRateYear1: Float as LRGExpectedRehabMgmtRateYear1 = null
    public var lrgExpectedRehabMgmtRateYear2: Float as LRGExpectedRehabMgmtRateYear2 = null
    public var lrgExpectedRehabMgmtRateYear3: Float as LRGExpectedRehabMgmtRateYear3 = null
    public var lrgExpectedRiskMgmtRate: Float as LRGExpectedRiskMgmtRate = null
    public var lrgExpectedRiskMgmtRateYear1: Float as LRGExpectedRiskMgmtRateYear1 = null
    public var lrgExpectedRiskMgmtRateYear2: Float as LRGExpectedRiskMgmtRateYear2 = null
    public var lrgExpectedRiskMgmtRateYear3: Float as LRGExpectedRiskMgmtRateYear3 = null
    public var lrgCredibilityWeighting: Float as LRGCredibilityWeighting = null
    public var lrgCredibilityWeightingYear1: Float as LRGCredibilityWeightingYear1 = null
    public var lrgCredibilityWeightingYear2: Float as LRGCredibilityWeightingYear2 = null
    public var lrgCredibilityWeightingYear3: Float as LRGCredibilityWeightingYear3 = null
    public var uncappedLRGRehabMgmtComp: Float as UncappedLRGRehabMgmtComp = null
    public var uncappedLRGRehabMgmtCompYear1: Float as UncappedLRGRehabMgmtCompYear1 = null
    public var uncappedLRGRehabMgmtCompYear2: Float as UncappedLRGRehabMgmtCompYear2 = null
    public var uncappedLRGRehabMgmtCompYear3: Float as UncappedLRGRehabMgmtCompYear3 = null
    public var uncappedLRGRiskMgmtComp: Float as UncappedLRGRiskMgmtComp = null
    public var uncappedLRGRiskMgmtCompYear1: Float as UncappedLRGRiskMgmtCompYear1 = null
    public var uncappedLRGRiskMgmtCompYear2: Float as UncappedLRGRiskMgmtCompYear2 = null
    public var uncappedLRGRiskMgmtCompYear3: Float as UncappedLRGRiskMgmtCompYear3 = null
    public var cappedLRGRehabMgmtComp: Float as CappedLRGRehabMgmtComp = null
    public var cappedLRGRehabMgmtCompYear1: Float as CappedLRGRehabMgmtCompYear1 = null
    public var cappedLRGRehabMgmtCompYear2: Float as CappedLRGRehabMgmtCompYear2 = null
    public var cappedLRGRehabMgmtCompYear3: Float as CappedLRGRehabMgmtCompYear3 = null
    public var cappedLRGRiskMgmtComp: Float as CappedLRGRiskMgmtComp = null
    public var cappedLRGRiskMgmtCompYear1: Float as CappedLRGRiskMgmtCompYear1 = null
    public var cappedLRGRiskMgmtCompYear2: Float as CappedLRGRiskMgmtCompYear2 = null
    public var cappedLRGRiskMgmtCompYear3: Float as CappedLRGRiskMgmtCompYear3 = null
    public var lrgIMod: Float as LRGIMod = null
    public var lrgEMod: Float as LRGEMod = null
    public var lrgEModYear1: Float as LRGEModYear1 = null
    public var lrgEModYear2: Float as LRGEModYear2 = null
    public var lrgEModYear3: Float as LRGEModYear3 = null
    public var beforeAdj_LRGWCDTotalYear1: Float as BeforeAdj_LRGWCDTotalYear1 = null
    public var beforeAdj_LRGWCDTotalYear2: Float as BeforeAdj_LRGWCDTotalYear2 = null
    public var beforeAdj_LRGWCDTotalYear3: Float as BeforeAdj_LRGWCDTotalYear3 = null

    public override function toString(): String {
      return "ERRunCalcLRGCompUploadDTO{" +
          "erID =" + erID + '' +
          ", calculationResultID =" + calculationResultID + '' +
          ", lrgCode =" + lrgCode + '' +
          ", lrgLiableEarningTotal =" + lrgLiableEarningTotal + '' +
          ", lrgLiableEarningTotalYear1 =" + lrgLiableEarningTotalYear1 + '' +
          ", lrgLiableEarningTotalYear2 =" + lrgLiableEarningTotalYear2 + '' +
          ", lrgLiableEarningTotalYear3 =" + lrgLiableEarningTotalYear3 + '' +
          ", lrgLevyDueTotal =" + lrgLevyDueTotal + '' +
          ", lrgLevyDueTotalYear1 =" + lrgLevyDueTotalYear1 + '' +
          ", lrgLevyDueTotalYear2 =" + lrgLevyDueTotalYear2 + '' +
          ", lrgLevyDueTotalYear3 =" + lrgLevyDueTotalYear3 + '' +
          ", lrgRiskMgmtClaimsTotal =" + lrgRiskMgmtClaimsTotal + '' +
          ", lrgRiskMgmtClaimsTotalYear1 =" + lrgRiskMgmtClaimsTotalYear1 + '' +
          ", lrgRiskMgmtClaimsTotalYear2 =" + lrgRiskMgmtClaimsTotalYear2 + '' +
          ", lrgRiskMgmtClaimsTotalYear3 =" + lrgRiskMgmtClaimsTotalYear3 + '' +
          ", lrgWCDTotal =" + lrgWCDTotal + '' +
          ", lrgWCDTotalYear1 =" + lrgWCDTotalYear1 + '' +
          ", lrgWCDTotalYear2 =" + lrgWCDTotalYear2 + '' +
          ", lrgWCDTotalYear3 =" + lrgWCDTotalYear3 + '' +
          ", lrgActualRehabMgmtRate =" + lrgActualRehabMgmtRate + '' +
          ", lrgActualRehabMgmtRateYear1 =" + lrgActualRehabMgmtRateYear1 + '' +
          ", lrgActualRehabMgmtRateYear2 =" + lrgActualRehabMgmtRateYear2 + '' +
          ", lrgActualRehabMgmtRateYear3 =" + lrgActualRehabMgmtRateYear3 + '' +
          ", lrgActualRiskMgmtRate =" + lrgActualRiskMgmtRate + '' +
          ", lrgActualRiskMgmtRateYear1 =" + lrgActualRiskMgmtRateYear1 + '' +
          ", lrgActualRiskMgmtRateYear2 =" + lrgActualRiskMgmtRateYear2 + '' +
          ", lrgActualRiskMgmtRateYear3 =" + lrgActualRiskMgmtRateYear3 + '' +
          ", lrgExpectedRehabMgmtRate =" + lrgExpectedRehabMgmtRate + '' +
          ", lrgExpectedRehabMgmtRateYear1 =" + lrgExpectedRehabMgmtRateYear1 + '' +
          ", lrgExpectedRehabMgmtRateYear2 =" + lrgExpectedRehabMgmtRateYear2 + '' +
          ", lrgExpectedRehabMgmtRateYear3 =" + lrgExpectedRehabMgmtRateYear3 + '' +
          ", lrgExpectedRiskMgmtRate =" + lrgExpectedRiskMgmtRate + '' +
          ", lrgExpectedRiskMgmtRateYear1 =" + lrgExpectedRiskMgmtRateYear1 + '' +
          ", lrgExpectedRiskMgmtRateYear2 =" + lrgExpectedRiskMgmtRateYear2 + '' +
          ", lrgExpectedRiskMgmtRateYear3 =" + lrgExpectedRiskMgmtRateYear3 + '' +
          ", lrgCredibilityWeighting =" + lrgCredibilityWeighting + '' +
          ", lrgCredibilityWeightingYear1 =" + lrgCredibilityWeightingYear1 + '' +
          ", lrgCredibilityWeightingYear2 =" + lrgCredibilityWeightingYear2 + '' +
          ", lrgCredibilityWeightingYear3 =" + lrgCredibilityWeightingYear3 + '' +
          ", uncappedLRGRehabMgmtComp =" + uncappedLRGRehabMgmtComp + '' +
          ", uncappedLRGRehabMgmtCompYear1 =" + uncappedLRGRehabMgmtCompYear1 + '' +
          ", uncappedLRGRehabMgmtCompYear2 =" + uncappedLRGRehabMgmtCompYear2 + '' +
          ", uncappedLRGRehabMgmtCompYear3 =" + uncappedLRGRehabMgmtCompYear3 + '' +
          ", uncappedLRGRiskMgmtComp =" + uncappedLRGRiskMgmtComp + '' +
          ", uncappedLRGRiskMgmtCompYear1 =" + uncappedLRGRiskMgmtCompYear1 + '' +
          ", uncappedLRGRiskMgmtCompYear2 =" + uncappedLRGRiskMgmtCompYear2 + '' +
          ", uncappedLRGRiskMgmtCompYear3 =" + uncappedLRGRiskMgmtCompYear3 + '' +
          ", cappedLRGRehabMgmtComp =" + cappedLRGRehabMgmtComp + '' +
          ", cappedLRGRehabMgmtCompYear1 =" + cappedLRGRehabMgmtCompYear1 + '' +
          ", cappedLRGRehabMgmtCompYear2 =" + cappedLRGRehabMgmtCompYear2 + '' +
          ", cappedLRGRehabMgmtCompYear3 =" + cappedLRGRehabMgmtCompYear3 + '' +
          ", cappedLRGRiskMgmtComp =" + cappedLRGRiskMgmtComp + '' +
          ", cappedLRGRiskMgmtCompYear1 =" + cappedLRGRiskMgmtCompYear1 + '' +
          ", cappedLRGRiskMgmtCompYear2 =" + cappedLRGRiskMgmtCompYear2 + '' +
          ", cappedLRGRiskMgmtCompYear3 =" + cappedLRGRiskMgmtCompYear3 + '' +
          ", lrgIMod =" + lrgIMod + '' +
          ", lrgEMod =" + lrgEMod + '' +
          ", lrgEModYear1 =" + lrgEModYear1 + '' +
          ", lrgEModYear2 =" + lrgEModYear2 + '' +
          ", lrgEModYear3 =" + lrgEModYear3 + '' +
          ", beforeAdj_LRGWCDTotalYear1 =" + beforeAdj_LRGWCDTotalYear1 + '' +
          ", beforeAdj_LRGWCDTotalYear2 =" + beforeAdj_LRGWCDTotalYear2 + '' +
          ", beforeAdj_LRGWCDTotalYear3 =" + beforeAdj_LRGWCDTotalYear3 + '' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERRunCalcLRGCompUploadParser implements IRowParser<ERRunCalcLRGCompUploadDTO> {
    private final var dateParser = new DateParser()
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERRunCalcLRGCompUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var calculationResultID = csvParser.nextString().trim().toOptional()
        var lrgCode = csvParser.nextString().trim().toOptional()
        var lrgLiableEarningTotal = csvParser.nextString().trim().toOptional()
        var lrgLiableEarningTotalYear1 = csvParser.nextString().trim().toOptional()
        var lrgLiableEarningTotalYear2 = csvParser.nextString().trim().toOptional()
        var lrgLiableEarningTotalYear3 = csvParser.nextString().trim().toOptional()
        var lrgLevyDueTotal = csvParser.nextString().trim().toOptional()
        var lrgLevyDueTotalYear1 = csvParser.nextString().trim().toOptional()
        var lrgLevyDueTotalYear2 = csvParser.nextString().trim().toOptional()
        var lrgLevyDueTotalYear3 = csvParser.nextString().trim().toOptional()
        var lrgRiskMgmtClaimsTotal = csvParser.nextString().trim().toOptional()
        var lrgRiskMgmtClaimsTotalYear1 = csvParser.nextString().trim().toOptional()
        var lrgRiskMgmtClaimsTotalYear2 = csvParser.nextString().trim().toOptional()
        var lrgRiskMgmtClaimsTotalYear3 = csvParser.nextString().trim().toOptional()
        var lrgWCDTotal = csvParser.nextString().trim().toOptional()
        var lrgWCDTotalYear1 = csvParser.nextString().trim().toOptional()
        var lrgWCDTotalYear2 = csvParser.nextString().trim().toOptional()
        var lrgWCDTotalYear3 = csvParser.nextString().trim().toOptional()
        var lrgActualRehabMgmtRate = csvParser.nextString().trim().toOptional()
        var lrgActualRehabMgmtRateYear1 = csvParser.nextString().trim().toOptional()
        var lrgActualRehabMgmtRateYear2 = csvParser.nextString().trim().toOptional()
        var lrgActualRehabMgmtRateYear3 = csvParser.nextString().trim().toOptional()
        var lrgActualRiskMgmtRate = csvParser.nextString().trim().toOptional()
        var lrgActualRiskMgmtRateYear1 = csvParser.nextString().trim().toOptional()
        var lrgActualRiskMgmtRateYear2 = csvParser.nextString().trim().toOptional()
        var lrgActualRiskMgmtRateYear3 = csvParser.nextString().trim().toOptional()
        var lrgExpectedRehabMgmtRate = csvParser.nextString().trim().toOptional()
        var lrgExpectedRehabMgmtRateYear1 = csvParser.nextString().trim().toOptional()
        var lrgExpectedRehabMgmtRateYear2 = csvParser.nextString().trim().toOptional()
        var lrgExpectedRehabMgmtRateYear3 = csvParser.nextString().trim().toOptional()
        var lrgExpectedRiskMgmtRate = csvParser.nextString().trim().toOptional()
        var lrgExpectedRiskMgmtRateYear1 = csvParser.nextString().trim().toOptional()
        var lrgExpectedRiskMgmtRateYear2 = csvParser.nextString().trim().toOptional()
        var lrgExpectedRiskMgmtRateYear3 = csvParser.nextString().trim().toOptional()
        var lrgCredibilityWeighting = csvParser.nextString().trim().toOptional()
        var lrgCredibilityWeightingYear1 = csvParser.nextString().trim().toOptional()
        var lrgCredibilityWeightingYear2 = csvParser.nextString().trim().toOptional()
        var lrgCredibilityWeightingYear3 = csvParser.nextString().trim().toOptional()
        var uncappedLRGRehabMgmtComp = csvParser.nextString().trim().toOptional()
        var uncappedLRGRehabMgmtCompYear1 = csvParser.nextString().trim().toOptional()
        var uncappedLRGRehabMgmtCompYear2 = csvParser.nextString().trim().toOptional()
        var uncappedLRGRehabMgmtCompYear3 = csvParser.nextString().trim().toOptional()
        var uncappedLRGRiskMgmtComp = csvParser.nextString().trim().toOptional()
        var uncappedLRGRiskMgmtCompYear1 = csvParser.nextString().trim().toOptional()
        var uncappedLRGRiskMgmtCompYear2 = csvParser.nextString().trim().toOptional()
        var uncappedLRGRiskMgmtCompYear3 = csvParser.nextString().trim().toOptional()
        var cappedLRGRehabMgmtComp = csvParser.nextString().trim().toOptional()
        var cappedLRGRehabMgmtCompYear1 = csvParser.nextString().trim().toOptional()
        var cappedLRGRehabMgmtCompYear2 = csvParser.nextString().trim().toOptional()
        var cappedLRGRehabMgmtCompYear3 = csvParser.nextString().trim().toOptional()
        var cappedLRGRiskMgmtComp = csvParser.nextString().trim().toOptional()
        var cappedLRGRiskMgmtCompYear1 = csvParser.nextString().trim().toOptional()
        var cappedLRGRiskMgmtCompYear2 = csvParser.nextString().trim().toOptional()
        var cappedLRGRiskMgmtCompYear3 = csvParser.nextString().trim().toOptional()
        var lrgIMod = csvParser.nextString().trim().toOptional()
        var lrgEMod = csvParser.nextString().trim().toOptional()
        var lrgEModYear1 = csvParser.nextString().trim().toOptional()
        var lrgEModYear2 = csvParser.nextString().trim().toOptional()
        var lrgEModYear3 = csvParser.nextString().trim().toOptional()
        var beforeAdj_LRGWCDTotalYear1 = csvParser.nextString().trim().toOptional()
        var beforeAdj_LRGWCDTotalYear2 = csvParser.nextString().trim().toOptional()
        var beforeAdj_LRGWCDTotalYear3 = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(calculationResultID, lrgCode)
        var dto = new ERRunCalcLRGCompUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        calculationResultID.each(\value -> {dto.CalculationResultID = Integer.valueOf(value)})
        lrgCode.each(\value -> {dto.LRGCode = Integer.valueOf(value)})
        lrgLiableEarningTotal.each(\value -> {dto.LRGLiableEarningTotal = new BigDecimal(value).toMonetaryAmount()})
        lrgLiableEarningTotalYear1.each(\value -> {dto.LRGLiableEarningTotalYear1 = new BigDecimal(value).toMonetaryAmount()})
        lrgLiableEarningTotalYear2.each(\value -> {dto.LRGLiableEarningTotalYear2 = new BigDecimal(value).toMonetaryAmount()})
        lrgLiableEarningTotalYear3.each(\value -> {dto.LRGLiableEarningTotalYear3 = new BigDecimal(value).toMonetaryAmount()})
        lrgLevyDueTotal.each(\value -> {dto.LRGLevyDueTotal = new BigDecimal(value).toMonetaryAmount()})
        lrgLevyDueTotalYear1.each(\value -> {dto.LRGLevyDueTotalYear1 = new BigDecimal(value).toMonetaryAmount()})
        lrgLevyDueTotalYear2.each(\value -> {dto.LRGLevyDueTotalYear2 = new BigDecimal(value).toMonetaryAmount()})
        lrgLevyDueTotalYear3.each(\value -> {dto.LRGLevyDueTotalYear3 = new BigDecimal(value).toMonetaryAmount()})
        lrgRiskMgmtClaimsTotal.each(\value -> {dto.LRGRiskMgmtClaimsTotal = Float.valueOf(value)})
        lrgRiskMgmtClaimsTotalYear1.each(\value -> {dto.LRGRiskMgmtClaimsTotalYear1 = Float.valueOf(value)})
        lrgRiskMgmtClaimsTotalYear2.each(\value -> {dto.LRGRiskMgmtClaimsTotalYear2 = Float.valueOf(value)})
        lrgRiskMgmtClaimsTotalYear3.each(\value -> {dto.LRGRiskMgmtClaimsTotalYear3 = Float.valueOf(value)})
        lrgWCDTotal.each(\value -> {dto.LRGWCDTotal = Float.valueOf(value)})
        lrgWCDTotalYear1.each(\value -> {dto.LRGWCDTotalYear1 = Float.valueOf(value)})
        lrgWCDTotalYear2.each(\value -> {dto.LRGWCDTotalYear2 = Float.valueOf(value)})
        lrgWCDTotalYear3.each(\value -> {dto.LRGWCDTotalYear3 = Float.valueOf(value)})
        lrgActualRehabMgmtRate.each(\value -> {dto.LRGActualRehabMgmtRate = Float.valueOf(value)})
        lrgActualRehabMgmtRateYear1.each(\value -> {dto.LRGActualRehabMgmtRateYear1 = Float.valueOf(value)})
        lrgActualRehabMgmtRateYear2.each(\value -> {dto.LRGActualRehabMgmtRateYear2 = Float.valueOf(value)})
        lrgActualRehabMgmtRateYear3.each(\value -> {dto.LRGActualRehabMgmtRateYear3 = Float.valueOf(value)})
        lrgActualRiskMgmtRate.each(\value -> {dto.LRGActualRiskMgmtRate = Float.valueOf(value)})
        lrgActualRiskMgmtRateYear1.each(\value -> {dto.LRGActualRiskMgmtRateYear1 = Float.valueOf(value)})
        lrgActualRiskMgmtRateYear2.each(\value -> {dto.LRGActualRiskMgmtRateYear2 = Float.valueOf(value)})
        lrgActualRiskMgmtRateYear3.each(\value -> {dto.LRGActualRiskMgmtRateYear3 = Float.valueOf(value)})
        lrgExpectedRehabMgmtRate.each(\value -> {dto.LRGExpectedRehabMgmtRate = Float.valueOf(value)})
        lrgExpectedRehabMgmtRateYear1.each(\value -> {dto.LRGExpectedRehabMgmtRateYear1 = Float.valueOf(value)})
        lrgExpectedRehabMgmtRateYear2.each(\value -> {dto.LRGExpectedRehabMgmtRateYear2 = Float.valueOf(value)})
        lrgExpectedRehabMgmtRateYear3.each(\value -> {dto.LRGExpectedRehabMgmtRateYear3 = Float.valueOf(value)})
        lrgExpectedRiskMgmtRate.each(\value -> {dto.LRGExpectedRiskMgmtRate = Float.valueOf(value)})
        lrgExpectedRiskMgmtRateYear1.each(\value -> {dto.LRGExpectedRiskMgmtRateYear1 = Float.valueOf(value)})
        lrgExpectedRiskMgmtRateYear2.each(\value -> {dto.LRGExpectedRiskMgmtRateYear2 = Float.valueOf(value)})
        lrgExpectedRiskMgmtRateYear3.each(\value -> {dto.LRGExpectedRiskMgmtRateYear3 = Float.valueOf(value)})
        lrgCredibilityWeighting.each(\value -> {dto.LRGCredibilityWeighting = Float.valueOf(value)})
        lrgCredibilityWeightingYear1.each(\value -> {dto.LRGCredibilityWeightingYear1 = Float.valueOf(value)})
        lrgCredibilityWeightingYear2.each(\value -> {dto.LRGCredibilityWeightingYear2 = Float.valueOf(value)})
        lrgCredibilityWeightingYear3.each(\value -> {dto.LRGCredibilityWeightingYear3 = Float.valueOf(value)})
        uncappedLRGRehabMgmtComp.each(\value -> {dto.UncappedLRGRehabMgmtComp = Float.valueOf(value)})
        uncappedLRGRehabMgmtCompYear1.each(\value -> {dto.UncappedLRGRehabMgmtCompYear1 = Float.valueOf(value)})
        uncappedLRGRehabMgmtCompYear2.each(\value -> {dto.UncappedLRGRehabMgmtCompYear2 = Float.valueOf(value)})
        uncappedLRGRehabMgmtCompYear3.each(\value -> {dto.UncappedLRGRehabMgmtCompYear3 = Float.valueOf(value)})
        uncappedLRGRiskMgmtComp.each(\value -> {dto.UncappedLRGRiskMgmtComp = Float.valueOf(value)})
        uncappedLRGRiskMgmtCompYear1.each(\value -> {dto.UncappedLRGRiskMgmtCompYear1 = Float.valueOf(value)})
        uncappedLRGRiskMgmtCompYear2.each(\value -> {dto.UncappedLRGRiskMgmtCompYear2 = Float.valueOf(value)})
        uncappedLRGRiskMgmtCompYear3.each(\value -> {dto.UncappedLRGRiskMgmtCompYear3 = Float.valueOf(value)})
        cappedLRGRehabMgmtComp.each(\value -> {dto.CappedLRGRehabMgmtComp = Float.valueOf(value)})
        cappedLRGRehabMgmtCompYear1.each(\value -> {dto.CappedLRGRehabMgmtCompYear1 = Float.valueOf(value)})
        cappedLRGRehabMgmtCompYear2.each(\value -> {dto.CappedLRGRehabMgmtCompYear2 = Float.valueOf(value)})
        cappedLRGRehabMgmtCompYear3.each(\value -> {dto.CappedLRGRehabMgmtCompYear3 = Float.valueOf(value)})
        cappedLRGRiskMgmtComp.each(\value -> {dto.CappedLRGRiskMgmtComp = Float.valueOf(value)})
        cappedLRGRiskMgmtCompYear1.each(\value -> {dto.CappedLRGRiskMgmtCompYear1 = Float.valueOf(value)})
        cappedLRGRiskMgmtCompYear2.each(\value -> {dto.CappedLRGRiskMgmtCompYear2 = Float.valueOf(value)})
        cappedLRGRiskMgmtCompYear3.each(\value -> {dto.CappedLRGRiskMgmtCompYear3 = Float.valueOf(value)})
        lrgIMod.each(\value -> {dto.LRGIMod = Float.valueOf(value)})
        lrgEMod.each(\value -> {dto.LRGEMod = Float.valueOf(value)})
        lrgEModYear1.each(\value -> {dto.LRGEModYear1 = Float.valueOf(value)})
        lrgEModYear2.each(\value -> {dto.LRGEModYear2 = Float.valueOf(value)})
        lrgEModYear3.each(\value -> {dto.LRGEModYear3 = Float.valueOf(value)})
        beforeAdj_LRGWCDTotalYear1.each(\value -> {dto.BeforeAdj_LRGWCDTotalYear1 = Float.valueOf(value)})
        beforeAdj_LRGWCDTotalYear2.each(\value -> {dto.BeforeAdj_LRGWCDTotalYear2 = Float.valueOf(value)})
        beforeAdj_LRGWCDTotalYear3.each(\value -> {dto.BeforeAdj_LRGWCDTotalYear3 = Float.valueOf(value)})

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
        calculationResultID : Optional<String>,
        lrgCode : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!calculationResultID.isPresent())
        errors.add(new FieldValidationError("CalculationResultID is required"))
      if (!lrgCode.isPresent())
        errors.add(new FieldValidationError("LRGCode is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERRunCalcLRGCompProcessor extends AbstractCSVProcessor<ERRunCalcLRGCompUploadDTO> {
    construct(rowParser : IRowParser<ERRunCalcLRGCompUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERRunCalcLRGCompProcessor)
    }

    override function processRows(rows : List<ERRunCalcLRGCompUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERRunCalcLRGComps...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERRunCalcLRGComp(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERRunCalcLRGComp(lineNumber : int, dto : ERRunCalcLRGCompUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERRunCalcLRGComp_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERRunCalcLRGComp_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          if(dto.CalculationResultID != null) {
            var oERRunCalcResult = getERRunCalcResult("er:" + dto.CalculationResultID)
            if(oERRunCalcResult != null) {
              oEntity.ERRunCalcResult = oERRunCalcResult
              if(dto.LRGCode != null) {
                var oERLRGCode = _erProcessUtils.getERParamLRG(dto.LRGCode, oERRunCalcResult.ERRun.ERRequest.LevyYear)
                if(oERLRGCode != null)
                  oEntity.ERParamLRG = oERLRGCode
              }
            }
          }
          oEntity.LRGLiableEarningTotal = dto.LRGLiableEarningTotal
          oEntity.LRGLiableEarningTotalYear1 = dto.LRGLiableEarningTotalYear1
          oEntity.LRGLiableEarningTotalYear2 = dto.LRGLiableEarningTotalYear2
          oEntity.LRGLiableEarningTotalYear3 = dto.LRGLiableEarningTotalYear3
          oEntity.LRGLevyDueTotal = dto.LRGLevyDueTotal
          oEntity.LRGLevyDueTotalYear1 = dto.LRGLevyDueTotalYear1
          oEntity.LRGLevyDueTotalYear2 = dto.LRGLevyDueTotalYear2
          oEntity.LRGLevyDueTotalYear3 = dto.LRGLevyDueTotalYear3
          oEntity.LRGRiskMgmtClaimsTotal = dto.LRGRiskMgmtClaimsTotal
          oEntity.LRGRiskMgmtClaimsTotalYear1 = dto.LRGRiskMgmtClaimsTotalYear1
          oEntity.LRGRiskMgmtClaimsTotalYear2 = dto.LRGRiskMgmtClaimsTotalYear2
          oEntity.LRGRiskMgmtClaimsTotalYear3 = dto.LRGRiskMgmtClaimsTotalYear3
          oEntity.LRGWCDTotal = dto.LRGWCDTotal
          oEntity.LRGWCDTotalYear1 = dto.LRGWCDTotalYear1
          oEntity.LRGWCDTotalYear2 = dto.LRGWCDTotalYear2
          oEntity.LRGWCDTotalYear3 = dto.LRGWCDTotalYear3
          oEntity.LRGActualRehabMgmtRate = dto.LRGActualRehabMgmtRate
          oEntity.LRGActualRehabMgmtRateYear1 = dto.LRGActualRehabMgmtRateYear1
          oEntity.LRGActualRehabMgmtRateYear2 = dto.LRGActualRehabMgmtRateYear2
          oEntity.LRGActualRehabMgmtRateYear3 = dto.LRGActualRehabMgmtRateYear3
          oEntity.LRGActualRiskMgmtRate = dto.LRGActualRiskMgmtRate
          oEntity.LRGActualRiskMgmtRateYear1 = dto.LRGActualRiskMgmtRateYear1
          oEntity.LRGActualRiskMgmtRateYear2 = dto.LRGActualRiskMgmtRateYear2
          oEntity.LRGActualRiskMgmtRateYear3 = dto.LRGActualRiskMgmtRateYear3
          oEntity.LRGExpectedRehabMgmtRate = dto.LRGExpectedRehabMgmtRate
          oEntity.LRGExpectedRehabMgmtRateYear1 = dto.LRGExpectedRehabMgmtRateYear1
          oEntity.LRGExpectedRehabMgmtRateYear2 = dto.LRGExpectedRehabMgmtRateYear2
          oEntity.LRGExpectedRehabMgmtRateYear3 = dto.LRGExpectedRehabMgmtRateYear3
          oEntity.LRGExpectedRiskMgmtRate = dto.LRGExpectedRiskMgmtRate
          oEntity.LRGExpectedRiskMgmtRateYear1 = dto.LRGExpectedRiskMgmtRateYear1
          oEntity.LRGExpectedRiskMgmtRateYear2 = dto.LRGExpectedRiskMgmtRateYear2
          oEntity.LRGExpectedRiskMgmtRateYear3 = dto.LRGExpectedRiskMgmtRateYear3
          oEntity.LRGCredibilityWeighting = dto.LRGCredibilityWeighting
          oEntity.LRGCredibilityWeightingYear1 = dto.LRGCredibilityWeightingYear1
          oEntity.LRGCredibilityWeightingYear2 = dto.LRGCredibilityWeightingYear2
          oEntity.LRGCredibilityWeightingYear3 = dto.LRGCredibilityWeightingYear3
          oEntity.UncappedLRGRehabMgmtComp = dto.UncappedLRGRehabMgmtComp
          oEntity.UncappedLRGRehabMgmtCompYear1 = dto.UncappedLRGRehabMgmtCompYear1
          oEntity.UncappedLRGRehabMgmtCompYear2 = dto.UncappedLRGRehabMgmtCompYear2
          oEntity.UncappedLRGRehabMgmtCompYear3 = dto.UncappedLRGRehabMgmtCompYear3
          oEntity.UncappedLRGRiskMgmtComp = dto.UncappedLRGRiskMgmtComp
          oEntity.UncappedLRGRiskMgmtCompYear1 = dto.UncappedLRGRiskMgmtCompYear1
          oEntity.UncappedLRGRiskMgmtCompYear2 = dto.UncappedLRGRiskMgmtCompYear2
          oEntity.UncappedLRGRiskMgmtCompYear3 = dto.UncappedLRGRiskMgmtCompYear3
          oEntity.CappedLRGRehabMgmtComp = dto.CappedLRGRehabMgmtComp
          oEntity.CappedLRGRehabMgmtCompYear1 = dto.CappedLRGRehabMgmtCompYear1
          oEntity.CappedLRGRehabMgmtCompYear2 = dto.CappedLRGRehabMgmtCompYear2
          oEntity.CappedLRGRehabMgmtCompYear3 = dto.CappedLRGRehabMgmtCompYear3
          oEntity.CappedLRGRiskMgmtComp = dto.CappedLRGRiskMgmtComp
          oEntity.CappedLRGRiskMgmtCompYear1 = dto.CappedLRGRiskMgmtCompYear1
          oEntity.CappedLRGRiskMgmtCompYear2 = dto.CappedLRGRiskMgmtCompYear2
          oEntity.CappedLRGRiskMgmtCompYear3 = dto.CappedLRGRiskMgmtCompYear3
          oEntity.LRGIMod = dto.LRGIMod
          oEntity.LRGEMod = dto.LRGEMod
          oEntity.LRGEModYear1 = dto.LRGEModYear1
          oEntity.LRGEModYear2 = dto.LRGEModYear2
          oEntity.LRGEModYear3 = dto.LRGEModYear3
          oEntity.BeforeAdj_LRGWCDTotalYear1 = dto.BeforeAdj_LRGWCDTotalYear1
          oEntity.BeforeAdj_LRGWCDTotalYear2 = dto.BeforeAdj_LRGWCDTotalYear2
          oEntity.BeforeAdj_LRGWCDTotalYear3 = dto.BeforeAdj_LRGWCDTotalYear3
          _log.info("${lineNumber}: Created ER Run Calculation LRG Component")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Run Calculation LRG Component failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
    private function getERRunCalcResult(publicID : String) : ERRunCalcResult_ACC {
      return Query.make(ERRunCalcResult_ACC)
          .compareIgnoreCase(ERRunCalcResult_ACC#PublicID, Relop.Equals, publicID)
          .select().AtMostOneRow
    }
  }
}