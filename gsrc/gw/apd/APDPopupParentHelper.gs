package gw.apd

uses gw.apd.model.APDTagContainer
uses gw.api.locale.DisplayKey

@Export
class APDPopupParentHelper {

  static function getParentReference(attribute : APDAttribute) : String {
    return getParentInternal(attribute.ParentType, attribute.Label)
  }

  static function getParentReference(clause : APDClause) : String {
    return getParentInternal(DisplayKey.get("Web.APDRule.Owner.Clause"), clause.Name)
  }

  static function getParentReference(dropdown : APDDropdownEntry) : String {
    return getParentInternal(DisplayKey.get("Web.APDRule.Owner.DropdownEntry"), dropdown.Name)
  }

  static function getParentReference(container : APDTagContainer) : String {
    if (container typeis APDClause) {
      return getParentReference(container as APDClause)
    } else if (container typeis APDAttribute) {
      return getParentReference(container as APDAttribute)
    } else if (container typeis APDDropdownEntry) {
      return getParentReference(container as APDDropdownEntry)
    } else {
      throw new IllegalArgumentException(DisplayKey.get("Web.PopupParent.ContainerTypeError",typeof container))
    }
  }

  private static function getParentInternal(type : String, name : String) : String {
    return name.HasContent? DisplayKey.get("Web.APDRule.Owner.ParentReference", type, name):type
  }

}