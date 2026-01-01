package gw.acc.npg.validators

uses gw.acc.npg.model.ProductLine
uses gw.api.locale.DisplayKey

class HasCostValidator {

  var brokenRules: List<String>

  public function validateHasCosts(line: ProductLine): List<String> {
    brokenRules = new ArrayList<String>()
    if (line.Costs.isEmpty()) {
      addToBrokeRules(ProductLine, line.EntityName, "Costs")
    }
    return brokenRules
  }

  private function addToBrokeRules(type: ProductModelProperty, typeName: String, field: String) {
    brokenRules.add(DisplayKey.get("Accelerator.NPG.Validation.EmptyList", type.Name, typeName, field))
  }
}