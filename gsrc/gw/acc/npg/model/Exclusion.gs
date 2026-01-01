package gw.acc.npg.model

uses gw.acc.npg.validators.IModelVisitor

/**
 * Model for holding all information about exclusion in new line of business.
 * This model helps to populate entities and gosu source related to exclusion
 */
class Exclusion extends BaseProductModel {

  var _coverable: gw.acc.npg.model.Coverable as Coverable

  /**
   * @return name for exclusion entity
   */
  property get EntityName(): String {
    return "${Coverable.EntityNameWithoutSuffix}Excl${Suffix}"
  }

  /**
   * @return description for exclusion entity
   */
  property get Description(): String {
    return "Exclusions directly attached to ${Coverable.EntityDisplayName}"
  }

  /**
   * @return table name for exclusion entity
   */
  property get TableName(): String {
    return EntityName.toLowerCase()
  }

  /**
   * @return implementation class name for {@link gw.api.domain.ExclusionAdapter} interface
   */
  property get ExclusionAdapterImplName(): String {
    return "${Coverable.EntityNameWithoutSuffix}ExclExclusionAdapter"
  }

  /**
   * @return implementing class name for {@link gw.api.logicalmatch.EffDatedLogicalMatcher}
   */
  property get ExclusionMatcherImplName(): String {
    return "${Coverable.EntityNameWithoutSuffix}ExclMatcher"
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