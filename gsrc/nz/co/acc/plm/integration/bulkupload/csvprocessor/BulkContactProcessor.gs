package nz.co.acc.plm.integration.bulkupload.csvprocessor

uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor
uses nz.co.acc.common.integration.bulkupload.csvprocessor.CSVProcessorResult
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError

uses nz.co.acc.plm.integration.bulkupload.csvprocessor.helper.BulkContactUtil
uses nz.co.acc.plm.integration.bulkupload.csvrowparser.CompanyContactParser
uses nz.co.acc.plm.integration.bulkupload.csvrowparser.PersonContactParser
uses nz.co.acc.plm.integration.bulkupload.csvtypes.contact.CompanyContact
uses nz.co.acc.plm.integration.bulkupload.csvtypes.contact.PersonContact
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.File

/**
 * Processes a CSV file to create new contacts
 * <p>
 * Created by OurednM on 14/06/2018.
 */
class BulkContactProcessor<RowType> extends AbstractCSVProcessor<RowType> {

  construct(rowParser : IRowParser<RowType>, updater : BulkUploadProcessUpdater, File : File) {
    super(rowParser, updater, File)
    _log = StructuredLogger.CONFIG.withClass(BulkContactProcessor)
  }

  static function companyContactImporter(
      updater : BulkUploadProcessUpdater, uploadFile : File) : BulkContactProcessor<CompanyContact> {
    return new BulkContactProcessor<CompanyContact>(new CompanyContactParser(), updater, uploadFile)
  }

  static function personContactImporter(
      updater : BulkUploadProcessUpdater, uploadFile : File) : BulkContactProcessor<PersonContact> {
    return new BulkContactProcessor<PersonContact>(new PersonContactParser(), updater, uploadFile)
  }

  override function processRows(contacts : List<RowType>) : CSVProcessorResult {
    _log.info("Importing ${contacts.Count} contacts...")

    var rowNumber = 0
    var lineNumber = 0
    var rowsSuccessful = 0
    var rowProcessErrors = new ArrayList<RowProcessError>()

    try {
      // these sets help prevent duplicate ACCIDs being inserted within the same database transaction.
      var personACCIDs = new HashSet<String>()
      var companyACCIDs = new HashSet<String>()

      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> {
        for (contact in contacts index i) {
          rowNumber = i + 1
          lineNumber = i + 2

          if (contact typeis CompanyContact) {
            if (companyACCIDs.contains(contact.ACCNumber) or BulkContactUtil.checkCompanyExists(contact.ACCNumber, b)) {
              rowProcessErrors.add(new RowProcessError(lineNumber, "Company exists with ACCNumber ${contact.ACCNumber}"))
              onFailure()
            } else {
              var companyContact = BulkContactUtil.toCompany(contact, b)
              b.add(companyContact)
              companyACCIDs.add(companyContact.ACCID_ACC)
              _log.info("${rowNumber} of ${contacts.Count}: Creating new company contact ACCID=${companyContact.ACCID_ACC}")
              rowsSuccessful += 1
              onSuccess()
            }

          } else if (contact typeis PersonContact) {
            if (personACCIDs.contains(contact.ACCNumber) or BulkContactUtil.checkPersonExists(contact.ACCNumber, b)) {
              rowProcessErrors.add(new RowProcessError(lineNumber, "Person exists with ACCNumber ${contact.ACCNumber}"))
              onFailure()
            } else {
              var personContact = BulkContactUtil.toPerson(contact, b)
              b.add(personContact)
              personACCIDs.add(personContact.ACCID_ACC)
              _log.info("${rowNumber} of ${contacts.Count}: Creating new person contact ACCID=${personContact.ACCID_ACC}")
              rowsSuccessful += 1
              onSuccess()
            }
          }
        }
      })
    } catch (e : Exception) {
      _log.error_ACC("Import failed", e)
      rowProcessErrors.add(new RowProcessError(rowNumber, "Error occurred. Failed to process file. No contacts were imported.\r\n${e.Message}\r\n${e.StackTraceAsString}"))
      return new CSVProcessorResult(0, rowProcessErrors)
    }

    _log.info("Finished importing ${contacts.Count} contacts.")
    return new CSVProcessorResult(rowsSuccessful, rowProcessErrors)
  }

}