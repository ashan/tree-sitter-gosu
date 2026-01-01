package nz.co.acc.plm.integration.bulkupload.csvprocessor

uses gw.api.database.Query
uses gw.api.database.Relop
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor
uses nz.co.acc.common.integration.bulkupload.csvprocessor.CSVProcessorResult
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError

uses nz.co.acc.plm.integration.bulkupload.csvrowparser.MigratedHoldParser
uses nz.co.acc.plm.integration.bulkupload.csvtypes.MigratedHold
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.File

/**
 * Processes a CSV file to remove holds on migrated policies
 */
class BulkMigratedHoldsProcessor extends AbstractCSVProcessor<MigratedHold> {

  private var _productCodeMap : HashMap<String, String> = {
      InstructionConstantHelper.PRODUCTKEY_WPC->ConstantPropertyHelper.PRODUCTCODE_WPC,
      InstructionConstantHelper.PRODUCTKEY_WPS->ConstantPropertyHelper.PRODUCTCODE_WPS,
      InstructionConstantHelper.PRODUCTKEY_CP->ConstantPropertyHelper.PRODUCTCODE_CP
  }

  construct(rowParser : IRowParser<MigratedHold>, updater : BulkUploadProcessUpdater, uploadFile : File) {
    super(rowParser, updater, uploadFile)
    _log = StructuredLogger.CONFIG.withClass(BulkMigratedHoldsProcessor)
  }

  static function newInstance(updater : BulkUploadProcessUpdater, uploadFile : File) : BulkMigratedHoldsProcessor {
    return new BulkMigratedHoldsProcessor(new MigratedHoldParser(), updater, uploadFile)
  }

  override function processRows(holds : List<MigratedHold>) : CSVProcessorResult {
    // stats for the log
    var holdsRemoved = 0
    var holdsNotFound = 0
    var rowProcessErrors = new LinkedList<RowProcessError>()

    _log.info("Importing ${holds.Count} migrated hold records...")

    for (migratedHold in holds index i) {
      var rowNumber = i + 1
      var lineNumber = i + 2

      try {

        var policyTerms = Query.make(PolicyTerm)
            .compare(PolicyTerm#AEPACCNumber_ACC, Relop.Equals, migratedHold.ACCNumber)
            .compare(PolicyTerm#AEPProductCode_ACC, Relop.Equals, _productCodeMap.get(migratedHold.Suffix))
            .compare(PolicyTerm#AEPFinancialYear_ACC, Relop.Equals, migratedHold.LevyYear)
            .select()
            .toList()

        if (policyTerms.isEmpty()) {
          _log.info("${rowNumber} of ${holds.Count}: PolicyTerm not found for ${migratedHold}")
          continue
        }

        for (policyTerm in policyTerms) {
          _log.info("${rowNumber} of ${holds.Count}: Processing ${migratedHold}, PolicyTerm ID=${policyTerm.ID}")

          // Note: This code is the same as that in PolicyFile_PolicyInfoDV
          gw.transaction.Transaction.runWithNewBundle(\bundle -> {
            policyTerm = bundle.add(policyTerm)

            policyTerm.HoldReassessment_ACC = false

            var holdReasons = policyTerm.HoldReasons_ACC
            if (holdReasons.IsEmpty) {
              holdsNotFound++
            } else {
              holdsRemoved++
            }
            for (holdReason in holdReasons) {
              policyTerm.removeFromHoldReasons_ACC(holdReason)
            }
            _log.info("${holdReasons.Count} holds removed on PolicyTerm ID=${policyTerm.ID}")

          }, User.util.getUnrestrictedUser())
        }

      } catch (e : Exception) {
        _log.info("Removing hold failed for ${migratedHold}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
      }
    }

    _log.info("Finished processing ${holds.Count} holds."
        + "\nNumber of PolicyTerms with no holds to remove: ${holdsNotFound}"
        + "\nNumber of PolicyTerms with holds removed: ${holdsRemoved}"
        + "\nNumber of failures: ${rowProcessErrors.Count}")

    return new CSVProcessorResult(holds.Count - rowProcessErrors.Count, rowProcessErrors)
  }
}