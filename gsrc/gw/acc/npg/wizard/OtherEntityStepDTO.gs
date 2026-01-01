package gw.acc.npg.wizard

class OtherEntityStepDTO {

  private var _entityName: String as EntityName
  private var _description: String as Description
  private var _fields:Set<WizardFieldDTO> as Fields = new LinkedHashSet()
}