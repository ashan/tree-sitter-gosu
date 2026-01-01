package gw.acc.npg.model

uses gw.acc.npg.validators.IModelVisitor

/**
 * Model for holding all information about rate factor in new line of business.
 * This model helps to populate entities and gosu source related to rate factor
 */
class RateFactor extends BaseProductModel {


  var _coverable: gw.acc.npg.model.Coverable as Coverable

  /**
   * @return name for rate factor entity
   */
  property get EntityName(): String {
    return "${Coverable.EntityNameWithoutSuffix}RF${Coverable.Suffix}"
  }

  /**
   * @return entityName after removing suffix if any
   */
  property get EntityNameWithoutSuffix(): String {
    return removeSuffix(EntityName)
  }

  /**
   * @return table name for rate factor entity
   */
  property get TableName(): String {
    return EntityName.toLowerCase()
  }

  /**
   * @return implementing class name for {@link gw.api.domain.RateFactorAdapter}
   */
  property get RateFactorAdapterImplName(): String {
    return "${Coverable.EntityNameWithoutSuffix}RateFactorAdapter"
  }

  /**
   * @return implementing class name for {@link gw.api.logicalmatch.EffDatedLogicalMatcher}
   */
  property get RateFactorMatcherImplName(): String {
    return "${Coverable.EntityNameWithoutSuffix}RateFactorMatcher"
  }

  property get Modifier(): gw.acc.npg.model.Modifier {
    return Coverable.Modifier
  }

  /**
   * @return Foreign key field to {@literal ModifierEntityName}
   */
  public property get ModifierFkField(): Field {
    return Modifier.asReferenceFkField
  }

  override function accept(visitor: IModelVisitor) {
    visitor.visit(this)
  }
}