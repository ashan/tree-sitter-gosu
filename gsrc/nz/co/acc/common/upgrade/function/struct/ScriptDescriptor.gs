package nz.co.acc.common.upgrade.function.struct

uses nz.co.acc.common.upgrade.DatamodelUpgradeEvent
uses nz.co.acc.common.upgrade.DatamodelUpgradeType

/**
 * @author Ron Webb
 * @since 2019-06-14
 */
structure ScriptDescriptor {
  property get Code() : String
  property get Description() : String
  property get Statements() : List<ScriptStatement>
  property get Event() : DatamodelUpgradeEvent
  property get Type() : DatamodelUpgradeType
  property get Order() : Integer
  property get Background() : Boolean
  property get Directory() : String
  property get Filename() : String
  property get Disable() : Boolean
  property get ServerID() : String
  property get NoExecute() : Boolean
  property get AlwaysExecute() : Boolean
}