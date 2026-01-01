package gw.acc.npg.builders

uses gw.acc.npg.model.Field
uses gw.acc.npg.model.OtherEntity

/**
 * Builder for building {@link gw.acc.npg.model.OtherEntity}
 */
class OtherEntityBuilder extends BaseProductModelBuilder<OtherEntityBuilder> {

  var _entityName: String
  var _description: String
  var _fields: List<Field>

  construct() {
    _fields = new ArrayList<Field>()
  }

  public function withEntityName(entityName: String): OtherEntityBuilder {
    _entityName = entityName
    return this
  }

  public function withDescription(desc: String): OtherEntityBuilder {
    _description = desc
    return this
  }

  public function withField(field: Field): OtherEntityBuilder {
    _fields.add(field)
    return this
  }

  public static function createBuilder(): OtherEntityBuilder {
    return new OtherEntityBuilder()
  }

  /**
   * @return new {@link OtherEntity} with provided information
   */
  public function build(): OtherEntity {
    var otherEntity = new OtherEntity()
    otherEntity.Suffix = _suffix
    otherEntity.LineDisplayName = _lineDisplayName
    otherEntity.LineEntityName = _lineEntityName
    otherEntity.EntityName = _entityName
    otherEntity.Description = _description
    otherEntity.Abbrevation = _abbr
    otherEntity.PackageName = _packageName
    otherEntity.Fields = _fields
    return otherEntity
  }
}