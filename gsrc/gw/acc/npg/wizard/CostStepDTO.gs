package gw.acc.npg.wizard

class CostStepDTO {

  private var _entityName: String as EntityName
  private var _description: String as Description
  private var _referenceName: String as ReferenceName
  private var _coverable: String as CoverableName
  private var _coverage: String as CoverageName
  private var _parentCost: String as ParentCost
  private var _fields:Set<WizardFieldDTO> as Fields = new LinkedHashSet()
}