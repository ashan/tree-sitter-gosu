package edge.capabilities.document

/**
 * Plugin used to generate document session identifiers.
 */
interface IDocumentSessionPlugin {

  /**
   * Retrieves a new document session for a specific user.
   */
  public function getDocumentSession() : String

  /**
   * Get the expiration time for a document session in minutes
   */
  public property get Expiration() : int
  
  
  /**
   * Checks if a document session is valid.
   */
  public function isSessionValid(sess : String) : Boolean
}
