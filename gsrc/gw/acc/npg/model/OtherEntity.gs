package gw.acc.npg.model

uses gw.acc.npg.validators.IModelVisitor

/**
 * Model for holding all information about other entities new line of business.
 * This model helps to populate other entity
 */
class OtherEntity extends BaseProductModel {

  private var _entityName: String as EntityName
  private var _description: String as Description
  private var _fields: List<Field>as Fields

  /**
   * @return table name for entity
   */
  property get TableName(): String {
    return EntityName.toLowerCase()
  }

  override function accept(visitor: IModelVisitor) {
    visitor.visit(this)
    this.Fields.each(\field -> {
      field.accept(visitor)
    })
  }
}