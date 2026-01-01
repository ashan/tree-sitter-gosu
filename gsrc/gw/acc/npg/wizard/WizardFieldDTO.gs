package gw.acc.npg.wizard

uses gw.acc.npg.model.ColumnType

class WizardFieldDTO {

  public static var COLUMN_TYPES:ColumnType[] = ColumnType.AllValues.toTypedArray()
  private var _type: ColumnType as ColumnType = ColumnType.Varchar
  private var _name: String as Name
  private var _desc: String as Desc
  private var _nullOk: boolean as Nullok
  private var _arrayEntity: String as Arrayentity
  private var _owner: Boolean as Owner
  private var _cascadeDelete: boolean as CascadeDelete
  private var _fkEntity: String as Fkentity
  private var _typelist: String as Typelist
  private var _size: Integer as Size
  private var _scale: Integer as Scale
  private var _precision: Integer as Precision
  private var _costKeyField: boolean as CostKeyField

}