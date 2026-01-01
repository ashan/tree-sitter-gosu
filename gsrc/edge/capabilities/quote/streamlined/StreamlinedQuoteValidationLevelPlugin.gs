package edge.capabilities.quote.streamlined

uses edge.capabilities.quote.quoting.IQuoteValidationLevelPlugin
uses edge.di.annotations.InjectableNode

class StreamlinedQuoteValidationLevelPlugin implements IQuoteValidationLevelPlugin {

  @InjectableNode
  construct() {
  }

  override function getValidationLevel(): ValidationLevel {
    return ValidationLevel.TC_QUICKQUOTABLE;
  }
}
