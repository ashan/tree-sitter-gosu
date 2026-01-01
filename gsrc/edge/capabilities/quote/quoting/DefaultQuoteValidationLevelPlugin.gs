package edge.capabilities.quote.quoting

uses edge.di.annotations.ForAllGwNodes

class DefaultQuoteValidationLevelPlugin implements IQuoteValidationLevelPlugin {

  @ForAllGwNodes
  construct() {
  }

  override function getValidationLevel(): ValidationLevel {
    return ValidationLevel.TC_DEFAULT;
  }
}
