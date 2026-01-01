package edge.capabilities.quote.lob.commercialproperty

uses edge.di.annotations.InjectableNode
uses edge.capabilities.quote.lob.ILobMetadataPlugin

class CpMetadataPlugin implements ILobMetadataPlugin {
  @InjectableNode
  construct() {
  }

  override function getQuestionSetCodes(): String[] {
    return {} // OOTB Commercial Property has no Question Sets
  }
}
