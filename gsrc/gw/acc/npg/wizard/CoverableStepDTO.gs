package gw.acc.npg.wizard

class CoverableStepDTO {

  private var _entityName:String as EntityName
  private var _description:String as Description
  private var _referredFrom:String as ReferredFrom
  private var _referenceName:String as ReferenceName
  private var _attachedToLocation:boolean as AttachedToLocation
  private var _attachedToBuilding:boolean as AttachedToBuilding
  private var _includeExclusions:boolean as IncludeExclusions
  private var _includeConditions:boolean as IncludeConditions
  private var _includeModifiers:boolean as IncludeModifiers
  private var _fields:Set<WizardFieldDTO> as Fields = new LinkedHashSet()

}