package gw.acc.npg.model

uses gw.acc.npg.builders.FieldBuilder
uses gw.acc.npg.validators.IValidatable
uses gw.acc.npg.schema.datamodel.enums.ScriptabilityType
uses gw.acc.npg.validators.IModelVisitor

/**
 * Model for holding all information about field. This field can be addition field, cost field,
 * coverable field or other entity field in provided line of business. This model helps to generate
 * xml for entity column.
 */
class Field implements IValidatable {

  var _type: ColumnType as Type
  var _name: String as Name
  var _desc: String as Description
  var _nullOk: boolean as NullOk
  var _exportable: Boolean as Exportable
  var _arrayEntity: String as ArrayEntity
  var _owner: Boolean as Owner
  var _costKeyField: Boolean as CostKeyField
  var _nonEffDated: Boolean as NonEffDated
  var _cascadeDelete: boolean as CascadeDelete
  var _fkEntity: String as FkEntity
  var _typelist: String as Typelist
  var _size: int as Size
  var _scale: int as Scale
  var _precision: int as Precision
  var _getterScriptability: ScriptabilityType as GetterScriptability
  var _setterScriptability: ScriptabilityType as SetterScriptability

  /**
   * Create array field with given information.
   *
   * @param name          array column name
   * @param description
   * @param arrayEntity   entity array referred to
   * @param owner
   * @param cascadeDelete
   * @return newly created array field
   */
  public static function createArrayField(name: String, description: String, arrayEntity: String, owner: boolean,
                                          cascadeDelete: boolean): Field {
    var arrayField = FieldBuilder.createBuilder()
        .withName(name)
        .withDescription(description)
        .withArrayEntity(arrayEntity)
        .withOwner(owner)
        .withCascadeDelete(cascadeDelete)
        .withColumnType(Array).build()
    return arrayField
  }

  property get GosuDataType(): String {
    switch (Type) {
      case Typekey:
        return _typelist
      case Array:
        return "List<${_arrayEntity}>"
      case Foreignkey:
        return "Key"
      case Bit:
        return "boolean"
      case AutoNumber:
      case Integer:
      case Longint:
      case Positiveinteger:
      case Nonnegativeinteger:
        return "java.lang.Integer"
      case Decimal:
      case Percentage:
      case Rate:
      case Money:
        return "java.math.BigDecimal"
      case Shorttext:
      case Mediumtext:
      case Longtext:
      case Varchar:
        return "String"
      case Datetime:
        return "java.util.Date"
      default:
        throw new UnsupportedOperationException("Field type: ${Type} can't be recogonized.")
    }
  }


  override function accept(visitor: IModelVisitor) {
    visitor.visit(this)
  }
}