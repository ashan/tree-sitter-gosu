package nz.co.acc.gwer.bulkupload

uses gw.api.util.DisplayableException
uses gw.api.web.WebFile
uses nz.co.acc.common.integration.bulkupload.BulkUploaderUIHelper
uses org.apache.commons.io.FilenameUtils

uses java.io.BufferedInputStream
uses java.io.File
uses java.io.FileOutputStream


class ERBulkUploaderUIHelper extends BulkUploaderUIHelper {

  override function executeBulkUpload() {
    if (_selectedFile == null) {
      return
    }

    if(_selectedUploadType == BulkUploadType_ACC.TC_ACTUARIALPARAMETERS or
       _selectedUploadType == BulkUploadType_ACC.TC_AEPEXITS) {
      if (!(_selectedFile.Name.endsWithIgnoreCase(".xlsx") || _selectedFile.Name.endsWithIgnoreCase(".xls"))) {
        throw new DisplayableException("File type must be .xlsb or .xls")
      }
    } else if (!(_selectedFile.Name.endsWithIgnoreCase(".txt") || _selectedFile.Name.endsWithIgnoreCase(".csv"))) {
      throw new DisplayableException("File type must be .txt or .csv")
    }

    var fileExtension = FilenameUtils.getExtension(_selectedFile.Name)
    var tmpFile = copyWebFileToFileWithExtension(_selectedFile, fileExtension)

    var bulkUploader = new ERBulkUploader(tmpFile, _selectedFile.Name, _selectedUploadType)

    try {
      executor.submit(\-> bulkUploader.run())
    } catch (e : Exception) {
      throw new DisplayableException("Bulk uploader can not be scheduled for execution", e)
    }
  }

  function copyWebFileToFileWithExtension(webFile : WebFile, extension : String) : File {
    final var fn = "copyWebFileToFile"

    var tmpFile = File.createTempFile("policycenter-erbulkuploader", extension)
    var bos : FileOutputStream
    var bis : BufferedInputStream

    try {
      bos = new FileOutputStream(tmpFile)
      bis = new BufferedInputStream(webFile.InputStream)
      var ba = new byte[2048]
      var count = bis.read(ba)
      while (count > 0) {
        bos.write(ba, 0, count)
        count = bis.read(ba)
      }
      return tmpFile

    } catch (e : Exception) {
      logError(fn, "Failed to process uploaded file", e)
      throw new DisplayableException("Failed to process uploaded file: " + e.toString())

    } finally {
      bis?.close()
      bos?.close()
    }
  }

}