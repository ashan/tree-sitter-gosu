package gw.acc.npg.model

uses gw.acc.npg.validators.IModelVisitor

/**
 * Model for holding all information about transaction for a cost in new line of business.
 * This model helps to populate transaction entity and gosu source related to it.
 */
class Transaction extends BaseProductModel {

  var _cost: gw.acc.npg.model.BaseCost as Cost

  /**
   * @return entity name for transaction entity
   */
  property get EntityName(): String {
    return "${Abbrevation}Transaction${Suffix}"
  }

  /**
   * @return description for transaction entity
   */
  property get Description(): String {
    return "A transaction for the ${LineDisplayName} line"
  }

  /**
   * @return table name for transaction entity
   */
  property get TableName(): String {
    return EntityName.toLowerCase()
  }

  /**
   * @return implementation class name for {@link gw.api.domain.financials.TransactionAdapter} interface
   */
  property get TransactionAdapterImplName(): String {
    return "${Abbrevation}TransactionAdapter"
  }

  /**
   * @return Foreign key field to Cost
   */
  property get FkFieldToCost(): Field {
    var fkField = Cost.asReferenceFkField()
    fkField.Description = "The cost this transaction modifies."
    return fkField
  }

  override function accept(visitor: IModelVisitor) {
    visitor.visit(this)
  }
}