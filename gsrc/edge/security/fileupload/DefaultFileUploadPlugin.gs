package edge.security.fileupload

uses edge.di.annotations.ForAllGwNodes

class DefaultFileUploadPlugin implements IFileUploadPlugin {

  /**
   * List of allowed content types. If empty the DISALLOWED_CONTENT_TYPES is used
   */
  private static final var ALLOWED_CONTENT_TYPES : String[] = {}

  /**
   * List of disallowed content types for file uploads. Used only if ALLOWED_CONTENT_TYPES is empty
   */
  private static final var DISALLOWED_CONTENT_TYPES : String[] = {
    ".*html",
    ".*javascript"
  }

  @ForAllGwNodes
  construct(){}

  override function canUploadContentType(contentType: String): boolean {
    if (ALLOWED_CONTENT_TYPES.IsEmpty) {
      return !DISALLOWED_CONTENT_TYPES.hasMatch( \pattern -> contentType.matches(pattern))
    } else {
      return ALLOWED_CONTENT_TYPES.hasMatch( \pattern -> contentType.matches(pattern))
    }
  }
}
