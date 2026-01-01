package nz.co.acc.plm.integration.bulkupload.csvprocessor

uses nz.co.acc.accountcontact.AccountContactUtil_ACC
uses nz.co.acc.accountcontact.error.ContactMultipleMatchesException
uses nz.co.acc.accountcontact.error.ContactRelationshipException
uses nz.co.acc.accountcontact.relationship.CompanyContactRelationship
uses nz.co.acc.accountcontact.relationship.PersonContactRelationship
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor
uses nz.co.acc.common.integration.bulkupload.csvprocessor.CSVProcessorResult
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError

uses nz.co.acc.plm.integration.bulkupload.csvrowparser.CompanyContactRelationshipParser
uses nz.co.acc.plm.integration.bulkupload.csvrowparser.PersonContactRelationshipParser
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.File

/**
 * Processes a CSV file to link contacts to accounts
 * <p>
 * Created by OurednM on 14/06/2018.
 */
class BulkContactRelationshipProcessor<RowType> extends AbstractCSVProcessor<RowType> {
  private var _deleteRelationships : Boolean

  private construct(
      rowParser : IRowParser<RowType>,
      updater : BulkUploadProcessUpdater,
      uploadFile : File,
      deleteRelationships : Boolean) {

    super(rowParser, updater, uploadFile)
    this._deleteRelationships = deleteRelationships
    _log = StructuredLogger.CONFIG.withClass(BulkContactRelationshipProcessor)
  }

  private static reified function relationshipAdder<T>(
      rowParser : IRowParser<T>,
      updater : BulkUploadProcessUpdater,
      uploadFile : File) : BulkContactRelationshipProcessor<T> {
    return new BulkContactRelationshipProcessor<T>(rowParser, updater, uploadFile, false)
  }

  private static reified function relationshipDeleter<T>(
      rowParser : IRowParser<T>,
      updater : BulkUploadProcessUpdater,
      uploadFile : File) : BulkContactRelationshipProcessor<T> {
    return new BulkContactRelationshipProcessor<T>(rowParser, updater, uploadFile, true)
  }

  static function companyContactRelationshipAdder(
      updater : BulkUploadProcessUpdater,
      uploadFile : File) : BulkContactRelationshipProcessor<CompanyContactRelationship> {
    return relationshipAdder(CompanyContactRelationshipParser.relationshipAddingParser(), updater, uploadFile)
  }

  static function companyContactRelationshipDeleter(
      updater : BulkUploadProcessUpdater,
      uploadFile : File) : BulkContactRelationshipProcessor<CompanyContactRelationship> {
    return relationshipDeleter(CompanyContactRelationshipParser.relationshipDeletingParser(), updater, uploadFile)
  }

  static function personContactRelationshipAdder(
      updater : BulkUploadProcessUpdater,
      uploadFile : File) : BulkContactRelationshipProcessor<PersonContactRelationship> {
    return relationshipAdder(PersonContactRelationshipParser.relationshipAddingParser(), updater, uploadFile)
  }

  static function personContactRelationshipDeleter(
      updater : BulkUploadProcessUpdater,
      uploadFile : File) : BulkContactRelationshipProcessor<PersonContactRelationship> {
    return relationshipDeleter(PersonContactRelationshipParser.relationshipDeletingParser(), updater, uploadFile)
  }

  override function processRows(parsedRows : List<RowType>) : CSVProcessorResult {
    _log.info("Processing ${parsedRows.Count} contact relationships...")
    var rowProcessErrors : ArrayList<RowProcessError> = {}
    var successCount = 0

    for (contactRelationship in parsedRows index i) {
      var rowNumber = i + 1
      var lineNumber = i + 2

      try {
        processRelationship(contactRelationship)
        successCount += 1
        onSuccess()

      } catch (e : ContactMultipleMatchesException) {
        rowProcessErrors.add(new RowProcessError(lineNumber, "Multiple contacts found for ${contactRelationship}"))
        onFailure()

      } catch (e : com.guidewire.pl.web.controller.UserDisplayableException) {
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()

      } catch (e : ContactRelationshipException) {
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()

      } catch (e : Exception) {
        rowProcessErrors.add(new RowProcessError(lineNumber, e.toString()))
        onFailure()
      }
    }

    _log.info("Successfully processed ${successCount}  of ${parsedRows.Count} rows. "
        + "There were ${rowProcessErrors.Count} errors during processing.")
    return new CSVProcessorResult(successCount, rowProcessErrors)
  }

  private function processRelationship(contactRelationship : RowType) {
    if (contactRelationship typeis CompanyContactRelationship) {
      if (_deleteRelationships) {
        AccountContactUtil_ACC.deleteCompanyContactRelationship(contactRelationship)
      } else {
        AccountContactUtil_ACC.createCompanyContactRelationship(contactRelationship)
      }
    } else if (contactRelationship typeis PersonContactRelationship) {
      if (_deleteRelationships) {
        AccountContactUtil_ACC.deletePersonContactRelationship(contactRelationship)
      } else {
        AccountContactUtil_ACC.createPersonContactRelationship(contactRelationship)
      }
    }
  }
}