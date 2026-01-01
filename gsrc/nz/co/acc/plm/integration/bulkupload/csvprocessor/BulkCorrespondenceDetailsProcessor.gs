package nz.co.acc.plm.integration.bulkupload.csvprocessor

uses gw.api.database.Query
uses gw.util.GosuStringUtil
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor
uses nz.co.acc.common.integration.bulkupload.csvprocessor.CSVProcessorResult
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError

uses nz.co.acc.plm.integration.bulkupload.csvrowparser.CorrespondenceDetailsParser
uses nz.co.acc.plm.integration.bulkupload.csvtypes.ContactType_ACC
uses nz.co.acc.plm.integration.bulkupload.csvtypes.CorrespondenceDetailsRow
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.File

class BulkCorrespondenceDetailsProcessor extends AbstractCSVProcessor<CorrespondenceDetailsRow> {

  construct(rowParser : IRowParser<CorrespondenceDetailsRow>, updater : BulkUploadProcessUpdater, uploadFile : File) {
    super(rowParser, updater, uploadFile)
    _log = StructuredLogger.CONFIG.withClass(BulkCorrespondenceDetailsProcessor)
  }

  public static function newInstance(
      updater : BulkUploadProcessUpdater,
      uploadFile : File) : BulkCorrespondenceDetailsProcessor {
    var parser = new CorrespondenceDetailsParser()
    return new BulkCorrespondenceDetailsProcessor(parser, updater, uploadFile)
  }

  override function processRows(parsedRows : List<CorrespondenceDetailsRow>) : CSVProcessorResult {
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

      var contact = (row.contactType == AccountHolder)  ? account.AccountHolderContact : account.PrimaryContact_ACC

      try {
        gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
          account = bundle.add(account)
          contact = bundle.add(contact)

          if (row.emailVerified != null) {
            contact.IsEmailVerified = row.emailVerified
            if (row.emailVerified) {
              contact.EmailVerifiedDate_ACC = Date.Now
            } else {
              contact.EmailVerifiedDate_ACC = null
            }
          }

          if (GosuStringUtil.isNotBlank(row.primaryEmail)) {
            contact.EmailAddress1 = row.primaryEmail
          }

          if (GosuStringUtil.isNotBlank(row.secondaryEmail)) {
            contact.EmailAddress2 = row.secondaryEmail
          }

          if (row.correspondencePreference != null) {
            contact.CorrespondencePreference_ACC = row.correspondencePreference
          }

          if (contact.CorrespondencePreference_ACC == CorrespondencePreference_ACC.TC_EMAIL
              and contact.EmailAddress1 == null) {
            throw new BulkCorrespondenceValidationException("Primary email address cannot be null for email correspondence")
          }

          if (contact.CorrespondencePreference_ACC == CorrespondencePreference_ACC.TC_EMAIL
              and contact.EmailVerifiedDate_ACC == null) {
            throw new BulkCorrespondenceValidationException("Email must be verified for email correspondence")
          }

          if (row.emailVerified and contact.EmailAddress1 == null) {
            throw new BulkCorrespondenceValidationException("Null primary email address cannot be verified")
          }
        })
        _log.info("Finished Processing ${parsedRows.Count} records")
        onSuccess()

      } catch (e : Throwable) {
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