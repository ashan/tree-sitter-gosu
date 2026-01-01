package edge.security.fileupload

/**
 * Interface for File Upload security checking
 */
interface IFileUploadPlugin {

  /**
   * Check if the content type specified can be uploaded
   */
  @Param("contentType", "The Content Type that should be checked to see if it can be uploaded.")
  @Returns("true if the content type is allowed to be uploaded, otherwise false.")
  function canUploadContentType(contentType : String) : boolean

}
