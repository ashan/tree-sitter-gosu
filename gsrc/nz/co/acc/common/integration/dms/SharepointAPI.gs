package nz.co.acc.common.integration.dms

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.security.OAuthAPI
uses nz.co.acc.common.integration.security.OAuthException
uses nz.co.acc.common.integration.security.OAuthProperties
uses nz.co.acc.common.integration.security.OAuthResult
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses org.apache.commons.io.IOUtils
uses org.apache.http.HttpHeaders
uses org.apache.http.HttpStatus
uses org.apache.http.client.methods.HttpGet
uses org.apache.http.client.methods.HttpPost
uses org.apache.http.entity.ByteArrayEntity
uses org.apache.http.entity.StringEntity
uses org.apache.http.impl.client.HttpClientBuilder
uses org.json.simple.JSONObject
uses org.json.simple.parser.JSONParser

uses java.io.InputStream
uses java.io.InputStreamReader
uses java.net.URI
uses java.net.URLEncoder
uses java.util.concurrent.locks.ReentrantLock

/**
 * This is the implementation class for SharePoint API used for interfacing with SharePoint Online.
 * <p>
 * Created by Nick Mei on 2/02/2017.
 */
class SharepointAPI extends OAuthAPI {
  final static var _lock = new ReentrantLock()
  final static var _spoOAuthResult = new OAuthResult(null, null)  // Initial token is invalid.
  private static var _log = StructuredLogger.INTEGRATION.withClass(SharepointAPI)

  function apiCheckpoint() {
    try {
      apiCheckpoint(_lock, _spoOAuthResult, new SPOAuthProperties())
    } catch (e: OAuthException) {
      throw new DocumentStoreException("SharePoint Online OAuth authentication issue.", e)
    }
  }

  /**
   * Not being used yet, but will be in the future.
   * <p>
   * Returns the sharepoint GUID that identifies the file criteria.
   *
   * @param path
   * @param title
   * @return
   */
  @Throws(DocumentNotFoundException, "Document requested was not found in document store.")
  @Throws(DocumentStoreException, "Unexpected failure getting the document.")
  function getDocumentGUID(path: String, title: String): String {
    final var funcName = "getDocumentGUID"
    apiCheckpoint()

    var encodedPath = encodeForURLPart(path)
    var encodedTitle = encodeForURLPart(title)
    var urlString = "${ConfigurationProperty.DMS_SHAREPOINT_SITE_COLLECTION_API_URL.PropertyValue}/web/GetFolderByServerRelativeUrl('${encodedPath}')/Files('${encodedTitle}')/UniqueId"
    var request = new HttpGet(new URI(urlString))
    request.setHeader(HttpHeaders.ACCEPT, "application/json;odata=verbose");
    request.setHeader(HttpHeaders.AUTHORIZATION, "Bearer ${_spoOAuthResult.AccessToken.Token}");

    var client = HttpClientBuilder.create().build()
    var response = client.execute(request)
    var status = response.getStatusLine().getStatusCode()
    switch (status) {
      case HttpStatus.SC_OK:
        var jsonRoot = parseJSON(response.getEntity().getContent())
        var jsonData = jsonRoot.get("d") as JSONObject
        return jsonData.get("UniqueId") as String
      case HttpStatus.SC_NOT_FOUND:
        var msg = "Requested document is missing, path=${encodedPath} title=${encodedTitle}"
        _log.debug( msg)
        throw new DocumentNotFoundException(msg)
      default:
        // Unexpected status code.
        var msg = "HTTP Status=${status} for document, path=${encodedPath} title=${encodedTitle}"
        _log.error_ACC(msg)
        throw new DocumentStoreException(msg)
    }
  }

  /**
   * Returns the contents of a file from sharepoint.
   *
   * @param strDocUID
   * @return
   */
  @Throws(DocumentNotFoundException, "Document requested was not found in document store.")
  @Throws(DocumentStoreException, "Unexpected failure getting the document.")
  function getDocumentFileContent(strDocUID: String): InputStream {
    final var funcName = "getDocumentFileContent"
    apiCheckpoint()

    var urlString = "${ConfigurationProperty.DMS_SHAREPOINT_SITE_COLLECTION_API_URL.PropertyValue}/web/GetFileById('${strDocUID}')/$value"
    var request = new HttpGet(new URI(urlString))
    request.setHeader(HttpHeaders.ACCEPT, "application/octet")
    request.setHeader(HttpHeaders.AUTHORIZATION, "Bearer ${_spoOAuthResult.AccessToken.Token}")

    var client = HttpClientBuilder.create().build()
    var response = client.execute(request)
    var status = response.getStatusLine().getStatusCode()
    switch (status) {
      case HttpStatus.SC_OK:
        return response.getEntity().getContent();
      case HttpStatus.SC_NOT_FOUND:
        var msg = "Requested document is missing, GUID=${strDocUID} responseBody=" + IOUtils.toString(response.getEntity().getContent())
        _log.debug( msg)
        throw new DocumentNotFoundException(msg)
      default:
        // Unexpected status code.
        var msg = "Unexpected returned HTTP Status=${status} for document, GUID=${strDocUID} responseBody=${IOUtils.toString(response.getEntity().getContent())}"
        _log.error_ACC( msg)
        throw new DocumentStoreException(msg);
    }
  }

  /**
   * Add the contents of the file to sharepoint.
   *
   * @param inputStream - file content
   * @return String - string Doc UID
   */
  @Throws(DocumentStoreException, "Unexpected failure getting the document.")
  function addDocumentFileContent(serverRelativeURLPath: String, fileInputStream: InputStream, filename: String, overwriteFlag: boolean): String {
    final var funcName = "addDocumentFileContent"
    apiCheckpoint()

    var encodedFilename = encodeForURLPart(filename)
    var relativePath = encodeForURLPart(serverRelativeURLPath)
    var urlString = "${ConfigurationProperty.DMS_SHAREPOINT_SITE_COLLECTION_API_URL.PropertyValue}/web/GetFolderByServerRelativeUrl('${relativePath}')/Files/add(url='${encodedFilename}',overwrite=${overwriteFlag})"
    var request = new HttpPost(new URI(urlString))
    request.setHeader(HttpHeaders.ACCEPT, "application/json;odata=verbose")
    request.setHeader(HttpHeaders.AUTHORIZATION, "Bearer ${_spoOAuthResult.AccessToken.Token}")
    var bytes = IOUtils.toByteArray(fileInputStream)
    request.setEntity(new ByteArrayEntity(bytes))

    var client = HttpClientBuilder.create().build()
    var response = client.execute(request);
    var status = response.getStatusLine().getStatusCode()
    switch (status) {
      case HttpStatus.SC_OK:
        var jsonRoot = parseJSON(response.getEntity().getContent())
        var jsonData = jsonRoot.get("d") as JSONObject
        return jsonData.get("UniqueId") as String
      default:
        // Unexpected status code.
        var msg = "Unexpected returned HTTP Status=${status} for document, filename=${filename} responseBody=${IOUtils.toString(response.getEntity().getContent())}"
        _log.error_ACC( msg)
        throw new DocumentStoreException(msg)
    }
  }

  /**
   * Apply metadata to sharepoint document.
   *
   * @param strDocUID   - The Sharepoint GUID for the document.
   * @param docMetadata - Applies the metadata from this object to the SP document.
   */
  @Throws(DocumentStoreException, "Unexpected failure applying meta data to the document.")
  function applyMetadataToDocument(strDocUID: String, docMetadata: DocumentMetadata) {
    final var funcName = "applyMetadataToDocument"
    apiCheckpoint()

    var urlString = "${ConfigurationProperty.DMS_SHAREPOINT_SITE_COLLECTION_API_URL.PropertyValue}/web/GetFileById('${strDocUID}')/ListItemAllFields"
    var request = new HttpPost(new URI(urlString))
    request.setHeader(HttpHeaders.ACCEPT, "application/json;odata=verbose")
    request.setHeader(HttpHeaders.AUTHORIZATION, "Bearer ${_spoOAuthResult.AccessToken.Token}")
    request.setHeader(HttpHeaders.CONTENT_TYPE, "application/json;odata=verbose")
    request.setHeader(HttpHeaders.IF_MATCH, "*")
    request.setHeader("X-HTTP-METHOD", "MERGE")

    // Build JSON Body request. e.g. {'__metadata': { 'type': 'SP.ListItem' }, 'ACCID':'1234','InvoiceNumber':'12345'}
    var jsonRoot = new JSONObject()
    var jsonMetadata = new JSONObject()
    jsonMetadata.put("type", "SP.ListItem")
    jsonRoot.put("__metadata", jsonMetadata)
    if (docMetadata.ACC_ID != null) {
      jsonRoot.put("ACCID", docMetadata.ACC_ID)
    }
    if (docMetadata.TaxInvoiceNumber != null) {
      jsonRoot.put("InvoiceNumber", docMetadata.TaxInvoiceNumber)
    }
    if (docMetadata.Status != null) {
      jsonRoot.put("DocumentStatus", docMetadata.Status)
    }
    jsonRoot.put("UserID", docMetadata.UserID)

    request.setEntity(new StringEntity(jsonRoot.toJSONString()))

    var client = HttpClientBuilder.create().build()
    var response = client.execute(request)
    var status = response.getStatusLine().getStatusCode()
    switch (status) {
      case HttpStatus.SC_NO_CONTENT:
        // Success.
        return
      case HttpStatus.SC_NOT_FOUND:
        var msg = "Requested document is missing, GUID=${strDocUID} responseBody=" + IOUtils.toString(response.getEntity().getContent())
        _log.debug( msg)
        throw new DocumentNotFoundException(msg)
      default:
        // Unexpected status code.
        var msg = "Unexpected returned HTTP Status=${status} for document, docUID=${strDocUID} responseBody=${IOUtils.toString(response.getEntity().getContent())}"
        _log.error_ACC( msg)
        throw new DocumentStoreException(msg);
    }
  }

  /**
   * Helper method to encode URL part properly.
   * <p>
   * For example, the default URLEncoder converts spaces to '+', which might be fine for query parameters but not for URI part as it requires %20.
   * The URLEncoder class is really a mis-leading name.
   *
   * @param urlString
   * @return
   */
  private function encodeForURLPart(urlString: String): String {
    var encodedString = URLEncoder.encode(urlString, "UTF-8")
    encodedString = encodedString.replaceAll("[+]", "%20")
    encodedString = encodedString.replaceAll("[/]", "%2F")
    return encodedString
  }

  /**
   * Helper to parse a JSON string to JSOObject.
   *
   * @param jsonInputStream
   * @return
   */
  private function parseJSON(jsonInputStream: InputStream): JSONObject {
    var parser = new JSONParser();
    var reader = new InputStreamReader(jsonInputStream, "UTF-8");
    var jsonRoot = parser.parse(reader) as JSONObject
    return jsonRoot
  }
}