package gw.acc.npg.model

uses gw.acc.npg.builders.FieldBuilder
uses gw.acc.npg.schema.datamodel.enums.ScriptabilityType
uses gw.acc.npg.validators.IModelVisitor

/**
 * Model for holding all information about base cost in new line of business.
 * This model helps to populate base cost entity and gosu source related to base cost
 */
class BaseCost extends BaseProductModel {

  property get EntityName(): String {
    return "${Abbrevation}Cost${Suffix}"
  }

  property get TableName(): String {
    return EntityName.toLowerCase()
  }

  /**
   * @return interface name for LineCostMethods
   */
  property get CostMethodsInterfaceName(): String {
    return "${Abbrevation}CostMethods"
  }

  property get GenericCostMethodsImplName(): String {
    return "Generic${Abbrevation}CostMethodsImpl"
  }

  /**
   * @return implementation class name for LineCostMethods
   */
  property get CostMethodsImplName(): String {
    return "${Abbrevation}CostMethodsImpl"
  }


  /**
   * @return implementation class name for {@link gw.api.domain.financials.CostAdapter}
   */
  property get CostAdapterImplName(): String {
    return "${Abbrevation}CostAdapter"
  }

  /**
   * @return entity name for transaction
   */
  property get TransactionEntityName(): String {
    return "${Abbrevation}Transaction${Suffix}"
  }

  /**
   * @return column name for transaction
   */
  property get TransactionColumnName(): String {
    return "Transactions"
  }

  property get TransactionArrayField(): Field {
    var arrayField = FieldBuilder.createBuilder()
        .withName(TransactionColumnName)
        .withDescription("${Abbrevation} Transactions")
        .withArrayEntity(TransactionEntityName)
        .withSetterScriptability(ScriptabilityType.Hidden)
        .withGetterScriptability(ScriptabilityType.DoesNotExist)
        .withCascadeDelete(true)
        .withColumnType(Array).build()
    return arrayField
  }

  /**
   * @return Foreign key field to line
   */
  property get LineFKField(): Field {
    var fkField = FieldBuilder.createBuilder()
        .withName(LineEntityNameWithoutSuffix)
        .withDescription("${LineDisplayName} line")
        .withFkEntity(LineEntityName)
        .withColumnType(Foreignkey)
        .withNullOk(false).build()
    return fkField
  }

  /**
   * @return line entity Name after removing suffix if any
   */
  property get LineEntityNameWithoutSuffix(): String {
    return removeSuffix(LineEntityName)
  }

  /**
   * @return entityName after removing suffix if any
   */
  property get EntityNameWithoutSuffix(): String {
    return removeSuffix(EntityName)
  }

  property get CostDataImplName(): String {
    return "${Abbrevation}CostData"
  }

  property get VersionListName(): String {
    return "${EntityName}VersionList"
  }

  property get CoverableInHierarchy(): gw.acc.npg.model.Coverable {
    return null
  }

  property get CoverageInHierarchy(): gw.acc.npg.model.Coverage {
    return null
  }

  /**
   * @return foreign key field to this cost
   */
  public function asReferenceFkField(): Field {
    var field = FieldBuilder.createBuilder()
        .withFkEntity(EntityName)
        .withName(EntityNameWithoutSuffix)
        .withNullOk(false)
        .withNonEffDated(true)
        .withColumnType(Foreignkey)
        .build()
    return field
  }

  override function accept(visitor: IModelVisitor) {
    visitor.visit(this)
  }
}