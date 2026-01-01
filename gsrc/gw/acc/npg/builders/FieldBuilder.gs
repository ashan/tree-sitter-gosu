package gw.acc.npg.builders

uses gw.acc.npg.model.ColumnType
uses gw.acc.npg.model.Field
uses gw.acc.npg.schema.datamodel.enums.ScriptabilityType

/**
 * Builder for building Fields
 */
class FieldBuilder {

  var _type: ColumnType
  var _name: String
  var _desc: String
  var _nullOk: boolean
  var _exportable: Boolean
  var _arrayEntity: String
  var _owner: Boolean
  var _cascadeDelete: boolean
  var _fkEntity: String
  var _typelist: String
  var _size: int
  var _scale: int
  var _precision: int
  var _getterScriptability: ScriptabilityType
  var _setterScriptability: ScriptabilityType
  var _nonEffDated: Boolean
  var _costKeyField: Boolean

  public function withColumnType(columneType: ColumnType): FieldBuilder {
    _type = columneType
    return this
  }

  public function withName(name: String): FieldBuilder {
    _name = name
    return this
  }

  public function withDescription(desc: String): FieldBuilder {
    _desc = desc
    return this
  }

  public function withNullOk(nullOk: boolean): FieldBuilder {
    _nullOk = nullOk
    return this
  }

  public function withCostKeyField(costKeyField: boolean): FieldBuilder {
    _costKeyField = costKeyField
    return this
  }

  public function withArrayEntity(arrayEntity: String): FieldBuilder {
    _arrayEntity = arrayEntity
    return this
  }

  public function withOwner(owner: boolean): FieldBuilder {
    _owner = owner
    return this
  }

  public function withExportable(exportable: boolean): FieldBuilder {
    _exportable = exportable
    return this
  }

  public function withCascadeDelete(cascadeDelete: boolean): FieldBuilder {
    _cascadeDelete = cascadeDelete
    return this
  }

  public function withFkEntity(fkEntity: String): FieldBuilder {
    _fkEntity = fkEntity
    return this
  }

  public function withTypelist(typelist: String): FieldBuilder {
    _typelist = typelist
    return this
  }

  public function withSize(size: int): FieldBuilder {
    _size = size
    return this
  }

  public function withScale(scale: int): FieldBuilder {
    _scale = scale
    return this
  }

  public function withPrecision(precision: int): FieldBuilder {
    _precision = precision
    return this
  }


  public function withGetterScriptability(getterScriptability: ScriptabilityType): FieldBuilder {
    _getterScriptability = getterScriptability
    return this
  }

  public function withSetterScriptability(setterScriptability: ScriptabilityType): FieldBuilder {
    _setterScriptability = setterScriptability
    return this
  }

  public function withNonEffDated(nonEffDated: boolean): FieldBuilder {
    _nonEffDated = nonEffDated
    return this
  }

  /**
   * @return new field with provided information
   */
  public function build(): Field {
    var field = new Field()
    field.Name = _name
    field.Description = _desc
    field.ArrayEntity = _arrayEntity
    field.Owner = _owner
    field.Exportable = _exportable
    field.CascadeDelete = _cascadeDelete
    field.Type = _type
    field.NullOk = _nullOk
    field.FkEntity = _fkEntity
    field.Typelist = _typelist
    field.Size = _size
    field.Scale = _scale
    field.Precision = _precision
    field.GetterScriptability = _getterScriptability
    field.SetterScriptability = _setterScriptability
    field.NonEffDated = _nonEffDated
    field.CostKeyField = _costKeyField
    return field
  }

  public static function createBuilder(): FieldBuilder {
    return new FieldBuilder()
  }

}