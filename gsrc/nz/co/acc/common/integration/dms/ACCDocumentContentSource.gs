package nz.co.acc.common.integration.dms

uses com.guidewire.pl.system.dependency.PLDependencies
uses gw.api.util.DisplayableException
uses gw.document.DocumentContentsInfo
uses gw.plugin.document.IDocumentContentSource
uses gw.plugin.util.CurrentUserUtil
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.util.GosuStringUtil
uses nz.co.acc.integration.dms.ACCDocumentContentSourceUtil
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

uses java.io.InputStream
uses java.time.LocalDateTime
uses java.time.format.DateTimeFormatter

/**
 * This class is used for the Guidewire IDocumentContentSource plugin, so that Guidewire application
 * can use this implementation which uses Sharepoint API to perform operations against Sharepoint Online.
 * <p>
 * Created by Nick Mei on 26/01/2017.
 */
class ACCDocumentContentSource implements IDocumentContentSource {

  private static var _log = StructuredLogger.INTEGRATION.withClass(ACCDocumentContentSource)

  var sharepoint = new SharepointAPI()

  /**
   * Allow user to upload documents to Sharepoint
   *
   * @return
   */
  override property get InboundAvailable() : boolean {
    return true
  }

  /**
   * Allow user to download documents from Sharepoint
   *
   * @return
   */
  override property get OutboundAvailable() : boolean {
    return true
  }

  /**
   * @param inputStream
   * @param document
   * @return false - To inform Guidewire to persist Document Entity (as the SPO Document and Metadata is successful)
   */
  override function addDocument(inputStream : InputStream, document : Document) : boolean {
    var funcName = "addDocument"
    try {
      // Generate file name
      var filename : String
      if (document.Inbound) {
        // Mailhouse files
        filename = document.Name
      } else {
        filename = ACCDocumentContentSourceUtil.generateUniqueFilename(document)
      }

      // Upload file to SharePoint
      logInfo("Adding document ${filename} to sharepoint.", funcName)
      var overwrite = false
      if (document.Inbound) {
        // JUNO-16484
        // Allow mailhouse file bulk upload to retry / overwrite existing files
        // Previous attempt may have failed after uploading when adding metadata (error 429 - too many requests)
        overwrite = true
      }
      var folderPath = ACCDocumentContentSourceUtil.sharePointDestinationFolderPath(document)
      var strDocUID = sharepoint.addDocumentFileContent(folderPath, inputStream, filename, overwrite)
      document.setDocUID(strDocUID)

      // Add metadata to new SharePoint file
      // Separate API call. Sometimes results in error 429 - too many requests
      var userID = CurrentUserUtil.CurrentUser.User.Credential.UserName
      var docMetadata = new DocumentMetadata(userID, document)
      sharepoint.applyMetadataToDocument(strDocUID, docMetadata)
      logInfo("Added document and applied metadata, ${filename} to sharepoint.", funcName)

      return false  // Because we require GW to persist the Document entity. See GW JavaDoc for IDocumentContentSourceBase

    } catch (e : Exception) {
      logError("Failed to add document", funcName, e)
      // Documentation says to throw the exception to the unit of work.
      throw new DisplayableException("Unable to save the file to Document store.", e)
    }
  }

  override function isDocument(document : Document) : boolean {
    return (document.DocUID != null and document.DMS == true and not(document.DocUID == "none"))
  }

  override function getDocumentContentsInfo(document : Document, includeContents : boolean) : DocumentContentsInfo {
    try {
      var inputStream = sharepoint.getDocumentFileContent(document.DocUID)
      var dci = new DocumentContentsInfo(DocumentContentsInfo.ContentResponseType.DOCUMENT_CONTENTS, inputStream, document.MimeType)
      return dci
    } catch (e : Exception) {
      logError("Failed to get document contents", "getDocumentContentsInfo", e)
      throw new DisplayableException("Unable to retrieve the file from Document store.", e)
    }
  }

  override function getDocumentContentsInfoForExternalUse(document : Document) : DocumentContentsInfo {
    return null
  }

  /**
   * There is no requirement to update a document, not even Supervisor.
   * Calling this function will return a displayable error to the user.
   */
  override function updateDocument(document : Document, inputStream : InputStream) : boolean {
    throw new DisplayableException("Update function not allowed!")
  }

  /**
   * Supervisors could have Delete powers.
   * We must not hard delete any documents from Sharepoint.
   * Instead perform Soft Delete, by update the Status=DELETED
   *
   * @param document
   * @return false - To inform Guidewire to persist (delete) the Document Entity (as the SPO Metadata is successful)
   */
  override function removeDocument(document : Document) : boolean {
    var funcName = "removeDocument"
    try {
      logInfo("Removing(Soft delete) document ${document.DocUID} from sharepoint.", funcName)
      var userID = CurrentUserUtil.CurrentUser.User.Credential.UserName
      var docMetadata = new DocumentMetadata(userID, "Deleted")
      sharepoint.applyMetadataToDocument(document.DocUID, docMetadata)
      logInfo("Removed(Soft delete) document ${document.DocUID} from sharepoint.", funcName)
      return false  // Because we require GW to persist the Document entity. See GW JavaDoc for IDocumentContentSourceBase
    } catch (e : Exception) {
      logError("Failed to remove document", funcName, e)
      // Documentation says to throw the exception to the unit of work.
      throw new DisplayableException("Unable to remove the file from Document store.", e)
    }
  }

  private function logInfo(msg : String, funcName : String) {
    _log.info(msg)
  }

  private function logError(errMsg : String, funcName : String, e : Exception) {
    if (e != null) {
      _log.error_ACC(errMsg, e)
    }
    _log.error_ACC(errMsg)
  }

}