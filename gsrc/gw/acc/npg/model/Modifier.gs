package gw.acc.npg.model

uses gw.acc.npg.builders.FieldBuilder
uses gw.acc.npg.validators.IModelVisitor

/**
 * Model for holding all information about modifier in new line of business.
 * This model helps to populate entities and gosu source related to modifier
 */
class Modifier extends BaseProductModel {

  var _coverable: gw.acc.npg.model.Coverable as Coverable

  /**
   * @return name for modifier entity
   */
  property get EntityName(): String {
    return "${Coverable.EntityNameWithoutSuffix}Mod${Suffix}"
  }

  /**
   * @return entityName after removing suffix if any
   */
  property get EntityNameWithoutSuffix(): String {
    return removeSuffix(EntityName)
  }

  /**
   * @return description for modifier entity
   */
  property get Description(): String {
    return "A modifier for ${Coverable.EntityDisplayName}"
  }

  /**
   * @return table name for modifier entity
   */
  property get TableName(): String {
    return EntityName.toLowerCase()
  }

  /**
   * @return implementation class name for {@link gw.api.domain.ModifierAdapter} interface
   */
  property get ModifierAdapterImplName(): String {
    return "${Coverable.EntityNameWithoutSuffix}ModifierAdapter"
  }

  /**
   * @return implementing class name for {@link gw.api.logicalmatch.EffDatedLogicalMatcher}
   */
  property get ModifierMatcherImplName(): String {
    return "${Coverable.EntityNameWithoutSuffix}ModifierMatcher"
  }

  /**
   * @return Foreign key field to Coverable
   */
  property get FkFieldToCoverable(): Field {
    return Coverable.asReferenceFkField()
  }

  property get RateFactorArrayField(): Field {
    return Field.createArrayField(RateFactorArrayColumnName, "Individual components of the rating factor",
        RateFactor.EntityName, false, true)
  }

  property get RateFactor(): gw.acc.npg.model.RateFactor {
    return Coverable.RateFactor
  }


  /**
   * @return column name for rate factor array
   */
  property get RateFactorArrayColumnName(): String {
    return "${Coverable.EntityNameWithoutSuffix}RateFactors"
  }

  /**
   * @return column name for modifier foreign key
   */
  property get FkColumnName(): String {
    return "${Coverable.EntityNameWithoutSuffix}Modifier"
  }

  /**
   * @return Foreign key field to this entity
   */
  public property get asReferenceFkField(): Field {
    var fkField = FieldBuilder.createBuilder()
        .withName(FkColumnName)
        .withColumnType(Foreignkey)
        .withFkEntity(EntityName)
        .withNullOk(false)
        .build()
    return fkField
  }

  override function accept(visitor: IModelVisitor) {
    visitor.visit(this)
  }
}