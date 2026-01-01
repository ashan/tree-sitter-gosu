package nz.co.acc.plm.integration.irbulk.inbound.email

uses com.google.common.annotations.VisibleForTesting
uses entity.Contact
uses gw.api.database.MultipleMatchesException
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.plugin.integration.inbound.InboundIntegrationHandlerPlugin
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.account.AccountUtil
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses nz.co.acc.plm.integration.irbulk.inbound.IRBulkProcessingValidationException
uses nz.co.acc.plm.integration.irbulk.inbound.IRBulkErrorFileWriter

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.IOException
uses java.nio.file.Files
uses java.nio.file.Path
uses java.nio.file.Paths

/**
 * Processes updated email addresses for IRD contacts.
 * Expects a pipe delimited text file.
 * Problematic rows are saved to an error file.
 * <p>
 * Created by mourednik on 26/01/2018.
 */
class InboundIRBulkEmailFeedHandler implements InboundIntegrationHandlerPlugin {

  @VisibleForTesting
  var lastInvalidRowErrorFile: Optional<Path>as readonly LastInvalidRowErrorFile = Optional.empty()

  @VisibleForTesting
  var lastUnknownContactErrorFile: Optional<Path>as readonly LastUnknownContactErrorFile = Optional.empty()

  @VisibleForTesting
  var lastMultipleContactErrorFile: Optional<Path>as readonly LastMultipleContactErrorFile = Optional.empty()

  /**
   * Main function
   *
   * @param o Should be a `Path` object
   */
  override function process(o: Object) {
    var fn = "process"

    var irFile = o as Path
    var maxLinesPerFile = getMaxLinesPerFile()
    logInfo(fn, "Processing file ${irFile}")
    logInfo(fn, "Email syntax validation is " + (isEmailValidationEnabled() ? "enabled" : "disabled"))
    logInfo(fn, "Maximum lines accepted per file = ${maxLinesPerFile}")

    validateFileSize(irFile, maxLinesPerFile)
    createErrorFolderIfNotExists()

    var irFileName = irFile.getFileName().toString()
    var invalidRowErrorFile = new IRBulkErrorFileWriter("invalid_rows", irFileName, getConfiguredErrorFolder())
    final var unknownContactErrorFile = new IRBulkErrorFileWriter("unknown_contacts", irFileName, getConfiguredErrorFolder())
    final var multipleContactErrorFile = new IRBulkErrorFileWriter("multiple_accids_found", irFileName, getConfiguredErrorFolder())

    try {
      processRecords(irFile, invalidRowErrorFile, unknownContactErrorFile, multipleContactErrorFile)

    } catch (e: Exception) {
      logError(fn, "Unrecoverable error occurred during processing. Not all records may have been processed. ${e.toString()}")
      throw e

    } finally {
      // Gosu always executes the finally block

      invalidRowErrorFile.flush()
      unknownContactErrorFile.flush()
      multipleContactErrorFile.flush()

      if (invalidRowErrorFile.lineCount() > 0) {
        logInfo(fn, "Found ${invalidRowErrorFile.lineCount()} invalid records in file ${irFile}")
        lastInvalidRowErrorFile = invalidRowErrorFile.FilePath
      }
      if (unknownContactErrorFile.lineCount() > 0) {
        logInfo(fn, "Found ${unknownContactErrorFile.lineCount()} IRD numbers which do not match to existing ACC contacts")
        lastUnknownContactErrorFile = unknownContactErrorFile.FilePath
      }
      if (multipleContactErrorFile.lineCount() > 0) {
        logInfo(fn, "Found ${multipleContactErrorFile.lineCount()} IRD numbers which match multiple ACC contacts")
        lastMultipleContactErrorFile = multipleContactErrorFile.FilePath
      }
    }
  }

  private function processRecords(
      irFile: Path,
      invalidRowErrorFile: IRBulkErrorFileWriter,
      unknownContactErrorFile: IRBulkErrorFileWriter,
      multipleContactErrorFile: IRBulkErrorFileWriter) {

    var fn = "processRecords"
    var numRows = 0

    Files.lines(irFile)
        .filter(\line -> !isBlankOrHeader(line))
        .forEach(\line -> {
          var optionalRecord = parseRecordFromLine(line)
          if (optionalRecord.isPresent()) {
            updateRecord(optionalRecord.get(), unknownContactErrorFile, multipleContactErrorFile)
          } else {
            logInfo("processRecords", "Found invalid row in IR file")
            invalidRowErrorFile.add(line)
          }
          numRows += 1
          if (numRows % 1000 == 0) {
            logInfo(fn, "Processed ${numRows} lines from file ${irFile} ...")
          }
        })
    var totalErrors = invalidRowErrorFile.lineCount() + unknownContactErrorFile.lineCount() + multipleContactErrorFile.lineCount()
    logInfo(fn, "Finished processing file ${irFile} (total ${numRows} rows processed with ${totalErrors} errors)")
  }

  private function parseRecordFromLine(line: String): Optional<EmailRecord> {
    var fn = "parseRecordFromLine"
    try {
      return Optional.of(new EmailRecord(line, isEmailValidationEnabled()))
    } catch (e: InvalidBulkEmailRecordException) {
      logDebug(fn, e.toString())
      return Optional.empty()
    }
  }

  private function validateFileSize(irFile: Path, maxLinesPerFile: Integer) {
    var fn = "validateFileSize"
    var lineCount = Files.lines(irFile)
        .filter(\line -> !isBlankOrHeader(line))
        .count()

    if (lineCount > maxLinesPerFile) {
      var msg = "Input file ${irFile} contains ${lineCount} nonblank/nonheader lines. Maximum lines accepted per file = ${maxLinesPerFile}."
      logError(fn, msg)
      throw new IRBulkProcessingValidationException(msg)
    }
  }

  private function isBlankOrHeader(line: String): Boolean {
    var fn = "isBlankOrHeader"
    if (!line.NotBlank) {
      logDebug(fn, "Skipping blank line of the ir bulk email feed")
      return true
    } else {
      var isHeader = line.trim().toLowerCase().startsWith("ird_number")
      if (isHeader) {
        logDebug(fn, "Skipping header record of the ir bulk email feed")
      }
      return isHeader
    }
  }

  @Throws(IOException, "If error folder can not be created")
  private function createErrorFolderIfNotExists() {
    var fn = "createErrorFolderIfNotExists"
    var errorFolder = getConfiguredErrorFolder()
    var path = Paths.get(errorFolder, {})
    if (Files.notExists(path, {})) {
      logWarn(fn, "Configured error folder `${errorFolder}` does not exist in filesystem. Attempting to create it. "
          + "It may be case that an updated configuration on disk has not been reloaded into this running instance.")
      Files.createDirectories(path, {})
    }
  }

  @VisibleForTesting
  public function isEmailValidationEnabled(): Boolean {
    return ScriptParameters.IRBulkEmailFeedEmailValidationEnabled_ACC
  }

  @VisibleForTesting
  public function getMaxLinesPerFile(): Integer {
    return ScriptParameters.IRBulkLinesPerFile_ACC
  }

  @VisibleForTesting
  public function getConfiguredErrorFolder(): String {
    return ConfigurationProperty.INBOUND_IR_BULKEMAIL_ERROR_FOLDER.PropertyValue
  }

  function updateRecord(
      record: EmailRecord,
      contactNotFoundErrorFile: IRBulkErrorFileWriter,
      duplicateContactErrors: IRBulkErrorFileWriter) {

    var fn = "updateRecord"

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      var accId = AccountUtil.IRDNumberToACCNumber(record.IRDNumber)
      var query = Query.make(Contact)
      query.compare(Contact#ACCID_ACC, Relop.Equals, accId)

      var contact: Contact = null
      try {
        contact = query.select().AtMostOneRow
        if (contact == null) {
          logInfo(fn, "No contact found for irdnumber=${record.IRDNumber}, accid=${accId}")
          contactNotFoundErrorFile.add(record.SourceRecord)
          return
        }
      } catch (e: MultipleMatchesException) {
        logInfo(fn, "Found multiple contacts found with accId=${accId}")
        duplicateContactErrors.add(record.SourceRecord)
        return
      }


      contact = bundle.add(contact)

      var irEmail = {record.MyIREmail, record.FirstEmail}
          .firstWhere(\irEmail -> irEmail != null && irEmail.NotBlank)

      if (irEmail != null) {
        contact.IREmailAddress = irEmail
      }

      if (StructuredLogger.INTEGRATION.DebugEnabled) {
        if (irEmail != null) {
          logDebug(fn, "Updated Contact (irdNumber=${record.IRDNumber}, accId=${contact.ACCID_ACC}) irEmail=${irEmail}")
        } else {
          logDebug(fn, "No changes to Contact (irdNumber=${record.IRDNumber}, accId=${contact.ACCID_ACC})")
        }
      }
    })
  }

  private function logInfo(fn: String, msg: String) {
    StructuredLogger.INTEGRATION.info(this + " " + fn + " " + msg)
  }

  private function logWarn(fn: String, msg: String) {
    StructuredLogger.INTEGRATION.warn_ACC(this + " " + fn + " " + msg)
  }

  private function logDebug(fn: String, msg: String) {
    StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + msg)
  }

  private function logError(fn: String, msg: String) {
    StructuredLogger.INTEGRATION.error_ACC( this + " " + fn + " " + msg)
  }
}
