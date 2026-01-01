package gw.bizrules.provisioning.contexts

@Export
class CommercialPropertyBuildingsIterableUWContextDefinition extends CommercialPropertyUWContextDefinition {
  public static final var PARAM_BUILDING: String = "cpBuilding"

  construct() {
    addIterativeSymbol(PARAM_BUILDING, CPBuilding, \ec -> ec.Period.CPLine.CPLocations.arrays("Buildings").toArray(new CPBuilding[0]))
  }

  override property get Key(): RuleContextDefinitionKey {
    return TC_CPPOLICYBUILDINGITERATIVE
  }
}