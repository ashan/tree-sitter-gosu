package nz.co.acc.gwer.bulkupload.processor

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.gwer.bulkupload.ERBulkUploadProcessUpdater
uses nz.co.acc.gwer.bulkupload.error.XLSRowProcessError
uses nz.co.acc.gwer.bulkupload.sheetprocessor.ERCULRGMappingProcessor
uses nz.co.acc.gwer.bulkupload.sheetprocessor.ERCalcTypeLevyYearProcessor
uses nz.co.acc.gwer.bulkupload.sheetprocessor.ERClaimsCalcExclusionProcessor
uses nz.co.acc.gwer.bulkupload.sheetprocessor.ERClaimsWeightingProcessor
uses nz.co.acc.gwer.bulkupload.sheetprocessor.ERCredibilityWeightingProcessor
uses nz.co.acc.gwer.bulkupload.sheetprocessor.EREModDiscountLoadingStepsProcessor
uses nz.co.acc.gwer.bulkupload.sheetprocessor.ERFundCodesProcessor
uses nz.co.acc.gwer.bulkupload.sheetprocessor.ERInjuryCategoriesProcessor
uses nz.co.acc.gwer.bulkupload.sheetprocessor.ERInjuryCodeProcessor
uses nz.co.acc.gwer.bulkupload.sheetprocessor.ERLRGParameterValuesProcessor
uses nz.co.acc.gwer.bulkupload.sheetprocessor.ERLevyPaymentGroupProcessor
uses nz.co.acc.gwer.bulkupload.sheetprocessor.ERLevyRiskGroupsProcessor
uses nz.co.acc.gwer.bulkupload.sheetprocessor.ERManualCalcProcessor
uses nz.co.acc.gwer.bulkupload.sheetprocessor.ERParameterValuesProcessor
uses nz.co.acc.gwer.bulkupload.sheetprocessor.ERPaymentTypeCodesProcessor
uses nz.co.acc.gwer.bulkupload.sheetprocessor.ERStepAdjustmentProcessor
uses nz.co.acc.gwer.bulkupload.xlsprocessor.AbstractXLSProcessor
uses nz.co.acc.gwer.bulkupload.xlsprocessor.AbstractXLSSheetProcessor
uses nz.co.acc.gwer.bulkupload.xlsprocessor.XLSProcessorResult
uses org.apache.poi.ss.usermodel.Sheet

uses java.io.File

/**
 * Processes a CSV file to update account statuses.
 * Created by HamblyAl on 18/03/2019.
 */
class BulkActualRialParametersProcessor  extends AbstractXLSProcessor {

  construct(updater : ERBulkUploadProcessUpdater, uploadFile : File) {
    super(updater, uploadFile)
    _log = StructuredLogger.CONFIG.withClass(BulkActualRialParametersProcessor)
  }

  public static function newInstance(
      updater : ERBulkUploadProcessUpdater,
      uploadFile : File) : BulkActualRialParametersProcessor {
    return new BulkActualRialParametersProcessor(updater, uploadFile)
  }

  private function createComment() : String {
    var comment = new StringBuilder()
    return comment.toString()
  }

  override function getSheetProcessor(sheet : Sheet) : AbstractXLSSheetProcessor {
    var processor : AbstractXLSSheetProcessor = null
    if (sheet.SheetName == ERParameterValuesProcessor.SHEET_NAME) {
      processor = ERParameterValuesProcessor.newInstance(_updater, sheet)
    } else if (sheet.SheetName == ERLevyRiskGroupsProcessor.SHEET_NAME) {
      processor = ERLevyRiskGroupsProcessor.newInstance(_updater, sheet)
    } else if (sheet.SheetName == EREModDiscountLoadingStepsProcessor.SHEET_NAME) {
      processor = EREModDiscountLoadingStepsProcessor.newInstance(_updater, sheet)
    } else if (sheet.SheetName == ERCredibilityWeightingProcessor.SHEET_NAME) {
      processor = ERCredibilityWeightingProcessor.newInstance(_updater, sheet)
    } else if (sheet.SheetName == ERLRGParameterValuesProcessor.SHEET_NAME) {
      processor = ERLRGParameterValuesProcessor.newInstance(_updater, sheet)
    } else if (sheet.SheetName == ERPaymentTypeCodesProcessor.SHEET_NAME) {
      processor = ERPaymentTypeCodesProcessor.newInstance(_updater, sheet)
    } else if (sheet.SheetName == ERLevyPaymentGroupProcessor.SHEET_NAME) {
      processor = ERLevyPaymentGroupProcessor.newInstance(_updater, sheet)
    } else if (sheet.SheetName == ERInjuryCodeProcessor.SHEET_NAME) {
      processor = ERInjuryCodeProcessor.newInstance(_updater, sheet)
    } else if (sheet.SheetName == ERInjuryCategoriesProcessor.SHEET_NAME) {
      processor = ERInjuryCategoriesProcessor.newInstance(_updater, sheet)
    } else if (sheet.SheetName == ERFundCodesProcessor.SHEET_NAME) {
      processor = ERFundCodesProcessor.newInstance(_updater, sheet)
    } else if (sheet.SheetName == ERClaimsWeightingProcessor.SHEET_NAME) {
      processor = ERClaimsWeightingProcessor.newInstance(_updater, sheet)
    } else if (sheet.SheetName == ERClaimsCalcExclusionProcessor.SHEET_NAME) {
      processor = ERClaimsCalcExclusionProcessor.newInstance(_updater, sheet)
    } else if (sheet.SheetName == ERStepAdjustmentProcessor.SHEET_NAME) {
      processor = ERStepAdjustmentProcessor.newInstance(_updater, sheet)
    } else if (sheet.SheetName == ERStepAdjustmentProcessor.SHEET_NAME) {
      processor = ERStepAdjustmentProcessor.newInstance(_updater, sheet)
    } else if (sheet.SheetName == ERCalcTypeLevyYearProcessor.SHEET_NAME) {
      processor = ERCalcTypeLevyYearProcessor.newInstance(_updater, sheet)
    } else if (sheet.SheetName == ERCULRGMappingProcessor.SHEET_NAME) {
      processor = ERCULRGMappingProcessor.newInstance(_updater, sheet)
    } else if (sheet.SheetName == ERManualCalcProcessor.SHEET_NAME) {
      processor = ERManualCalcProcessor.newInstance(_updater, sheet)
    }

    if (processor != null) {
      _log.info("Sheet name ${sheet.SheetName}, processor ${processor.Class.Name}")
    }

    return processor
  }
}