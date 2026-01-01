package edge.capabilities.policy.document.local

uses edge.capabilities.document.dto.DocumentReferenceDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.policy.document.IPolicyDocumentsPlugin

/**
 * Sample implementation for the ID card plugin. It considers
 * all documents with "sample" string in its name as ID cards and
 * chooses a latest one.
 */
final class SampleIdCardPlugin implements IIdCardPlugin {
  
  private var _docPlugin : IPolicyDocumentsPlugin
  
  @ForAllGwNodes
  @Param("docPlugin", "Plugin used to fetch all eligible (accessible) documents for each given policy")
  construct(docPlugin : IPolicyDocumentsPlugin) {
    _docPlugin = docPlugin
  }


  override function getIdCardDocument(policy : PolicyPeriod) : DocumentReferenceDTO {
    final var cardDocument = _docPlugin.getPolicyDocuments(policy)
      .where(\ d -> d.Name.contains("sample"))
      .sortBy(\ d -> d.DateModified)
      .last()
      
    if (cardDocument == null) {
      return null
    }
    
    return _docPlugin.getDocumentReference(cardDocument)
  }

}
