package nz.co.acc.integration.mailhouse.inbound

uses com.google.common.collect.Lists
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.integration.mailhouse.MailhouseFileUtil
uses nz.co.acc.util.ZipUtil

uses java.nio.file.Files
uses java.nio.file.Path

class MailhouseFileLoader {
  final static var LOG = StructuredLogger_ACC.INTEGRATION_FILE.withClass(MailhouseFileLoader)

  function process(zipFilePath : Path) {
    LOG.info("Processing file: ${zipFilePath}")
    var zipFileName = zipFilePath.getFileName().toString()
    var fileType = determineFileType(zipFileName)
    var header = createHeader(zipFileName, fileType)

    try {
      doProcess(header, zipFilePath)
      LOG.info("Finished processing file successfully: ${zipFilePath}")

    } catch (e : MailhouseFileLoadException) {
      LOG.error_ACC("Failed to process file: ${zipFilePath}: ${e.Message}")
      setStatusToError(header, e)
      throw e
    } catch (e : Exception) {
      LOG.error_ACC("Failed to process file: ${zipFilePath}", e)
      setStatusToError(header, e)
      throw e
    }
  }

  private function doProcess(header : MailhouseFile_ACC, zipFilePath : Path) {
    var zipFileName = zipFilePath.getFileName().toString()
    var baseDir = MailhouseFileUtil.getMailhouseWorkingDir()
    var subDir = MailhouseFileUtil.fileNameWithoutExtension(zipFileName)
    var workingDir = baseDir.resolve(subDir)
    if (Files.exists(workingDir)) {
      throw new MailhouseFileLoadException("File was already unzipped to ${workingDir}. Exiting process.")
    }
    ZipUtil.unzip(zipFilePath, workingDir)

    var metaDataFileName = MailhouseFileUtil.metadataFileName(zipFileName)
    var metaDataFile = workingDir.resolve(metaDataFileName)
    if (Files.notExists(metaDataFile)) {
      throw new MailhouseFileLoadException("Metadata file does not exist in archive. Expected file: ${metaDataFile}")
    }
    var metadata = parseFile(metaDataFile)
    validateFilesExist(workingDir, metadata)
    insertStagingRecords(header, metadata)
    setStatusToStaged(header, metadata.Count)
  }

  private function createHeader(zipFileName : String, fileType : MailhouseFileType_ACC) : MailhouseFile_ACC {
    var exists = Query.make(MailhouseFile_ACC)
        .compare(MailhouseFile_ACC#FileName, Relop.Equals, zipFileName)
        .select()
        .HasElements
    if (exists) {
      throw new MailhouseFileLoadException("File has already been loaded: ${zipFileName}")
    }

    var header : MailhouseFile_ACC

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      header = new MailhouseFile_ACC(bundle)
      header.setFileName(zipFileName)
      header.setFileType(fileType)
      header.setStatus(MailhouseFileStatus_ACC.TC_PROCESSING)
    })
    return header
  }

  private function insertStagingRecords(header : MailhouseFile_ACC, metadata : List<DocumentMetadata>) {
    LOG.info("Inserting staging records. Count=${metadata.Count}")
    var groups = Lists.partition(metadata, 100)
    for (group in groups) {
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        for (doc in group) {
          insertStagingRecord(bundle, header, doc)
        }
      })
    }
    LOG.info("Finished inserting staging records")
  }

  private function insertStagingRecord(bundle : Bundle, header : MailhouseFile_ACC, doc : DocumentMetadata) {
    var staging = new MailhouseStaging_ACC(bundle)
    staging.setMailhouseFile(header)
    staging.setStatus(MailhouseStagingStatus_ACC.TC_PENDING)
    staging.setFileName(doc.FileName)
    staging.setFileType(header.getFileType())
    staging.setReference(doc.Reference)
    staging.setDocumentDate(doc.DocumentDate.toDate())
    staging.setACCAccountID(doc.ACCAccountID)
    staging.setACCPolicyID(doc.ACCPolicyID)
  }

  private function setStatusToStaged(header : MailhouseFile_ACC, count : int) {
    header.refresh()
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      header = bundle.add(header)
      header.setStatus(MailhouseFileStatus_ACC.TC_STAGED)
      header.setRecordCount(count)
    })
  }

  private function setStatusToError(header : MailhouseFile_ACC, e : Exception) {
    header.refresh()
    var msg : String
    if (e typeis MailhouseFileLoadException) {
      msg = e.Message
    } else {
      msg = e.StackTraceAsString.truncate(1300)
    }
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      header = bundle.add(header)
      header.setStatus(MailhouseFileStatus_ACC.TC_ERROR)
      header.setErrorMessage(msg)
    })
  }

  private function validateFilesExist(dir : Path, docMetadataList : List<DocumentMetadata>) {
    for (doc in docMetadataList) {
      var filePath = dir.resolve(doc.FileName)
      if (Files.notExists(filePath)) {
        var msg = "Expected mailhouse document does not exist: ${filePath}"
        LOG.warn_ACC(msg)
        throw new MailhouseFileLoadException(msg)
      }
    }
    LOG.info("Verified all mailhouse documents exist in archive. Count=${docMetadataList.Count}")
  }

  static function parseFile(mailhouseFile : Path) : List<DocumentMetadata> {
    var result = new ArrayList<DocumentMetadata>(1000)
    mailhouseFile.toFile().eachLine(\line -> {
      if (line.NotBlank) {
        var docMetaData = new DocumentMetadata(line)
        result.add(docMetaData)
      }
    })
    return result
  }

  static function determineFileType(fileName : String) : MailhouseFileType_ACC {
    if (not fileName.endsWith(".zip")) {
      throw new MailhouseFileLoadException("File '${fileName}' does not have .zip file extension")
    }
    if (fileName.startsWithIgnoreCase("ACC-Letter-WM-BC")) {
      return MailhouseFileType_ACC.TC_LETTERWMBC;
    } else if (fileName.startsWithIgnoreCase("ACC-Letter-WM-PC")) {
      return MailhouseFileType_ACC.TC_LETTERWMPC;
    } else if (fileName.startsWithIgnoreCase("ACC-Letter-WM-ER")) {
      return MailhouseFileType_ACC.TC_LETTERWMER;
    } else if (fileName.startsWithIgnoreCase("ACC-LevyInvoice-NZ")) {
      return MailhouseFileType_ACC.TC_LEVYINVOICENZ;
    } else if (fileName.startsWithIgnoreCase("ACC-LevyInvoice-WM")) {
      return MailhouseFileType_ACC.TC_LEVYINVOICEWM;
    } else {
      throw new MailhouseFileLoadException("Cannot determine mailhouse file type for file name '${fileName}'")
    }
  }

}