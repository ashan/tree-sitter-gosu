package gw.acc.npg.model

uses gw.acc.npg.builders.FieldBuilder
uses gw.acc.npg.validators.IModelVisitor

/**
 * Model for holding all information about coverage in new line of business.
 * This model helps to populate entities and gosu source related to coverage
 */
class Coverage extends BaseProductModel {

  var _coverable: gw.acc.npg.model.Coverable as Coverable

  /**
   * @return name for coverage entity
   */
  property get EntityName(): String {
    return "${Coverable.EntityNameWithoutSuffix}Cov${Suffix}"
  }

  /**
   * @return description for coverage entity
   */
  property get Description(): String {
    return "Coverages directly attached to ${Coverable.EntityDisplayName}"
  }

  /**
   * @return table name for coverage entity
   */
  property get TableName(): String {
    return EntityName.toLowerCase()
  }

  /**
   * @return implementation class name for {@link gw.api.domain.CoverageAdapter} interface
   */
  property get CoverageAdapterImplName(): String {
    return "${Coverable.EntityNameWithoutSuffix}CovCoverageAdapter"
  }

  /**
   * @return implementing class name for {@link gw.api.logicalmatch.EffDatedLogicalMatcher}
   */
  property get CoverageMatcherImplName(): String {
    return "${Coverable.EntityNameWithoutSuffix}CovMatcher"
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

  property get IsLineCoverage(): boolean {
    return Coverable typeis ProductLine
  }


  /**
   * @return entityName after removing suffix if any
   */
  property get EntityNameWithoutSuffix(): String {
    return removeSuffix(EntityName)
  }

  property get PathToLine(): String {
    if (IsLineCoverage) {
      return Coverable.asReferenceFkField().Name
    }
    return "${Coverable.asReferenceFkField().Name}.${Coverable.PathToLine}"
  }

  /**
   * @return Foreign key field to this entity
   */
  public property get asReferenceFkField(): Field {
    var fkField = FieldBuilder.createBuilder()
        .withName(EntityNameWithoutSuffix)
        .withColumnType(Foreignkey)
        .withFkEntity(EntityName)
        .withExportable(true)
        .withNullOk(false)
        .build()
    return fkField
  }

  property get VersionListName(): String {
    return "${EntityName}VersionList"
  }

  override function accept(visitor: IModelVisitor) {
    visitor.visit(this)
  }
}