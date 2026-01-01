package edge.capabilities.quote.lob.personalauto

uses edge.di.annotations.InjectableNode
uses edge.capabilities.quote.lob.ILobMetadataPlugin

class PaMetadataPlugin implements ILobMetadataPlugin {
  @InjectableNode
  construct() {
  }

  override function getQuestionSetCodes(): String[] {
    return {"PAPersonalAutoPreQual", "PAPortal"}
  }
}
