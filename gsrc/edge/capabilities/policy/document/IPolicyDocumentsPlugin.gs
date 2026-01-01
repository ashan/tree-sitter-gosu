package edge.capabilities.policy.document

uses edge.capabilities.document.dto.DocumentReferenceDTO
uses edge.capabilities.policy.document.dto.PolicyDocumentDTO
uses edge.capabilities.policy.document.dto.PolicyDocumentUploadDTO


/**
 * Plugin used to deal with policy documents.
 * <p>This plugin should assume that user already have an access to
 * document's policy. So only document-level checks should be implemented
 * by this plugin.
 * <p>Each of plugin methods except canAccess may throw exceptions if user
 * is to authorized to access a policy document.
 */
interface IPolicyDocumentsPlugin {
  /**
   * Fetches a policy documents for the given policy.
   */
  @Param("user", "User to filter documents for")
  function getPolicyDocuments(doc : PolicyPeriod) :  Document[]
  

  /**
   * Fetches a document reference for the given document and user.
   */
  function getDocumentReference(doc : Document) : DocumentReferenceDTO
  
  /** 
   * Fetches detaised information about document.
   */
  function getDocumentDetails(doc : Document) : PolicyDocumentDTO
  
  /**
   * Creates a new document metadata using a given upload metadata.
   */
  function createDocumentMetadata(policy : PolicyPeriod, req : PolicyDocumentUploadDTO) :  Document
  
  /**
   * Deletes a document from the backend.
   */
  function deleteDocument(document : Document) : void
}
