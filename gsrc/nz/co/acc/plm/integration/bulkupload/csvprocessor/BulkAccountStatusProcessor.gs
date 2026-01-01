package nz.co.acc.plm.integration.bulkupload.csvprocessor

uses gw.api.database.Query
uses gw.pl.persistence.core.Bundle
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor
uses nz.co.acc.common.integration.bulkupload.csvprocessor.CSVProcessorResult
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError

uses nz.co.acc.plm.integration.bulkupload.csvrowparser.AccountStatusParser
uses nz.co.acc.plm.integration.bulkupload.csvtypes.account.AccountStatusRow
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.File

/**
 * Processes a CSV file to update account statuses.
 * Created by HamblyAl on 18/03/2019.
 */
class BulkAccountStatusProcessor extends AbstractCSVProcessor<AccountStatusRow> {

  construct(rowParser : IRowParser<AccountStatusRow>, updater : BulkUploadProcessUpdater, uploadFile : File) {
    super(rowParser, updater, uploadFile)
    _log = StructuredLogger.CONFIG.withClass(BulkAccountStatusProcessor)
  }

  public static function newInstance(
      updater : BulkUploadProcessUpdater,
      uploadFile : File) : BulkAccountStatusProcessor {
    var parser = new AccountStatusParser()
    return new BulkAccountStatusProcessor(parser, updater, uploadFile)
  }

  override function processRows(parsedRows : List<AccountStatusRow>) : CSVProcessorResult {
    _log.info("Importing ${parsedRows.Count} account statuses...")

    var rowsSuccessful = 0
    var lineNumber = 0
    var recordNumber = 0

    var rowProcessErrors = new ArrayList<RowProcessError>()

    try {
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> {
        for (accountStatusRow in parsedRows index i) {
          recordNumber = i + 1
          lineNumber = i + 2
          var account = findAccount(accountStatusRow.ACCNumber)
          if (account != null) {
            var statusOfAccount = StatusOfAccount_ACC.get(accountStatusRow.AccountStatus)
            if (statusOfAccount != null) {
              if (validateStatusOfAccount(account, statusOfAccount)) {
                updateAccount(b, account, statusOfAccount)
                _log.info("${recordNumber} of ${parsedRows.Count}: Updated status of account of ACCID=${accountStatusRow.ACCNumber} to ${accountStatusRow.AccountStatus}")
                rowsSuccessful += 1
                onSuccess()
              } else {
                rowProcessErrors.add(new RowProcessError(lineNumber, "Status of account type ${accountStatusRow.AccountStatus} is not valid for account type ${account.AccountHolderContact.Subtype}"))
                onFailure()
              }
            } else {
              rowProcessErrors.add(new RowProcessError(lineNumber, "No status of account type exists for ${accountStatusRow.AccountStatus}"))
              onFailure()
            }
          } else {
            rowProcessErrors.add(new RowProcessError(lineNumber, "No account exists with ACCNumber ${accountStatusRow.ACCNumber}"))
            onFailure()
          }
        }
      })
    } catch (e : Exception) {
      _log.error_ACC("Import failed: ${e.Message}")
      rowProcessErrors.add(new RowProcessError(lineNumber, "Error occurred. Failed to process file. No account statuses were updated.\r\n${e.Message}\r\n${e.StackTraceAsString}"))
      return new CSVProcessorResult(0, rowProcessErrors)
    }

    _log.info("Finished importing ${parsedRows.Count} account statuses.")
    return new CSVProcessorResult(rowsSuccessful, rowProcessErrors)
  }

  private function validateStatusOfAccount(account : Account, statusOfAccount : StatusOfAccount_ACC) : boolean {
    if (account.AccountHolderContact typeis Company) {
      return StatusOfAccount_ACC.TF_COMPANY.getTypeKeys().contains(statusOfAccount)
    } else if (account.AccountHolderContact typeis Person) {
      return StatusOfAccount_ACC.TF_PERSON.getTypeKeys().contains(statusOfAccount)
    }
    return false
  }

  private function updateAccount(b : Bundle, account : Account, statusOfAccount : StatusOfAccount_ACC) {
    account = b.add(account)
    account.setStatusOfAccount_ACC(statusOfAccount)
  }

  private function findAccount(accNumber : String) : Account {
    var query = Query.make(Account)
    query.compare(Account#ACCID_ACC, Equals, accNumber)
    var result = query.select()?.AtMostOneRow
    return result
  }
}