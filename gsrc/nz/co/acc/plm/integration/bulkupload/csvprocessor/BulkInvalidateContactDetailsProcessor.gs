package nz.co.acc.plm.integration.bulkupload.csvprocessor

uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor
uses nz.co.acc.common.integration.bulkupload.csvprocessor.CSVProcessorResult
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError

uses nz.co.acc.plm.integration.bulkupload.csvrowparser.InvalidateContactDetailsParser
uses nz.co.acc.plm.integration.bulkupload.csvtypes.InvalidateContactDetailsRow
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.File

class BulkInvalidateContactDetailsProcessor extends AbstractCSVProcessor<InvalidateContactDetailsRow> {

  construct(rowParser : IRowParser<InvalidateContactDetailsRow>, updater : BulkUploadProcessUpdater, uploadFile : File) {
    super(rowParser, updater, uploadFile)
    _log = StructuredLogger.CONFIG.withClass(BulkInvalidateContactDetailsProcessor)
  }

  public static function newInstance(
      updater : BulkUploadProcessUpdater,
      uploadFile : File) : BulkInvalidateContactDetailsProcessor {
    var parser = new InvalidateContactDetailsParser()
    return new BulkInvalidateContactDetailsProcessor(parser, updater, uploadFile)
  }

  override function processRows(parsedRows : List<InvalidateContactDetailsRow>) : CSVProcessorResult {
    _log.info("Processing ${parsedRows.Count} records")
    var rowProcessErrors = new ArrayList<RowProcessError>()

    for (row in parsedRows index i) {
      final var rowNumber = i + 1
      final var lineNumber = i + 2

      _log.info("Processing row ${rowNumber} of ${parsedRows.Count}")
      var account = findAccount(row.accId)

      if (account == null) {
        rowProcessErrors.add(new RowProcessError(lineNumber, "Account [${row.accId}] not found"))
        onFailure()
        continue
      }

      try {
        gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
          account = bundle.add(account)
          var primaryContact = bundle.add(account.PrimaryContact_ACC)
          if(row.invalidateType == InvalidContactInfoType_ACC.TC_EMAIL and primaryContact.IREmailVerifiedStatus_ACC != Boolean.FALSE)  {
            primaryContact.IREmailVerifiedStatus_ACC = Boolean.FALSE
            primaryContact.irEmailValidUntil()
            account.createCustomHistoryEvent(CustomHistoryType.TC_INVALIDATED_EMAIL, \-> DisplayKey.get("Contact.History.IREmailInvalid_ACC", primaryContact.IREmailAddress))
          } else if(row.invalidateType == InvalidContactInfoType_ACC.TC_PHONE and primaryContact.IRPhoneVerifiedStatus_ACC != Boolean.FALSE) {
            primaryContact.IRPhoneVerifiedStatus_ACC = Boolean.FALSE
            primaryContact.irPhoneValidUntil()
            account.createCustomHistoryEvent(CustomHistoryType.TC_INVALIDATED_PHONE, \-> DisplayKey.get("Contact.History.IRPhoneInvalid_ACC", primaryContact.IRCellPhone_ACC))
          }
        })

        onSuccess()

      } catch (e : Exception) {
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }

    return new CSVProcessorResult(getNumSuccesses(), rowProcessErrors)
  }

  private function findAccount(accNumber : String) : Account {
    return Query.make(Account)
        .compare(Account#ACCID_ACC, Equals, accNumber)
        .select()?.AtMostOneRow
  }

  class BulkCorrespondenceValidationException extends RuntimeException {
    public construct(msg : String) {
      super(msg)
    }
  }
}