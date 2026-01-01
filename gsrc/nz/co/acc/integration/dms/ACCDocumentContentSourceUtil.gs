package nz.co.acc.integration.dms

uses com.guidewire.pl.system.dependency.PLDependencies
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

uses java.time.LocalDateTime
uses java.time.format.DateTimeFormatter

class ACCDocumentContentSourceUtil {
  private static final var DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")

  /**
   * Generates a unique name for the SharePoint destination file.
   * The original file name for ad hoc uploads is not stored in Sharepoint but is stored in the GW Document table
   */
  public static function generateUniqueFilename(document : Document) : String {
    // fileExt includes the .(dot)
    var fileExt = PLDependencies.getMimeTypeManager().getFileExtension(document.getMimeType())

    var dateTimeNow = LocalDateTime.now()
    var timestamp = DATE_TIME_FORMATTER.format(dateTimeNow)

    if (document.Type.hasCategory(DocumentCategory_ACC.TC_AEP)) {
      var accID = document.Account.ACCID_ACC
      var docType = document.Type.Code.toUpperCase()
      var originalFilename = document.Name
      var spFilename = "AEP-${accID}-${docType}-${timestamp}-${originalFilename}${fileExt}"
      return spFilename

    } else {
      return "ACC-${document.getAccID()}-Adhoc-${ConfigurationProperty.DMS_SOURCE.PropertyValue}-${timestamp}${fileExt}"
    }
  }

  public static function sharePointDestinationFolderPath(document : Document) : String {
    var folderPath = ConfigurationProperty.DMS_SHAREPOINT_GUIDEWIRE_FOLDERPATH.PropertyValue
    if (document.Type.hasCategory(DocumentCategory_ACC.TC_AEP)) {
      folderPath = folderPath + "/" + ConfigurationProperty.DMS_SHAREPOINT_GUIDEWIRE_AEP_SUBFOLDER.PropertyValue
    }
    return folderPath
  }

}