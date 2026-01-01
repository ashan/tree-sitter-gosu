package gw.acc.npg.model

uses gw.acc.npg.validators.IModelVisitor


/**
 * Model for holding all information about condition in new line of business.
 * This model helps to populate entities and gosu source related to condition
 */
class Condition extends BaseProductModel {

  private var _coverable: gw.acc.npg.model.Coverable as Coverable

  /**
   * @return name for condition entity
   */
  property get EntityName(): String {
    return "${Coverable.EntityNameWithoutSuffix}Cond${Suffix}"
  }

  /**
   * @return description for condition entity
   */
  property get Description(): String {
    return "Conditions directly attached to ${Coverable.EntityDisplayName}"
  }

  /**
   * @return table name for condition entity
   */
  property get TableName(): String {
    return EntityName.toLowerCase()
  }

  /**
   * @return implementation class name for {@link gw.api.domain.PolicyConditionAdapter} interface
   */
  property get ConditionAdapterImplName(): String {
    return "${Coverable.EntityNameWithoutSuffix}CondConditionAdapter"
  }

  /**
   * @return implementing class name for {@link gw.api.logicalmatch.EffDatedLogicalMatcher}
   */
  property get ConditionMatcherImplName(): String {
    return "${Coverable.EntityNameWithoutSuffix}CondMatcher"
  }

  /**
   * @return Foreign key field to Coverable
   */
  property get FkFieldToCoverable(): Field {
    return Coverable.asReferenceFkField()
  }

  property get PathToJurisdiction(): String {
    return "${FkFieldToCoverable.Name}.${Coverable.PathToJurisdiction}"
  }

  override function accept(visitor: IModelVisitor) {
    visitor.visit(this)
  }
}