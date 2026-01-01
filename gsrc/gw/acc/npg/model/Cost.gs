package gw.acc.npg.model

uses gw.acc.npg.builders.FieldBuilder
uses gw.acc.npg.validators.IModelVisitor

/**
 * Model for holding all information about cost in new line of business.
 * This model helps to populate entities and gosu source related to cost
 */
class Cost extends BaseCost {

  private var _entityName: String as EntityName
  private var _description: String as Description
  private var _referenceName: String as ReferenceName
  private var _addtionalFields: List<Field>as AdditionalFields
  private var _coverable: gw.acc.npg.model.Coverable as Coverable
  private var _coverage: gw.acc.npg.model.Coverage as Coverage
  private var _parentCost: BaseCost as ParentCost
  private var _superEntityName: String as SuperEntityName

  /**
   * Create array field which holds information about this cost. This can be use
   * as reference to this cost from other entity.
   *
   * @return array field referring this cost
   */
  public function asReferenceArrayField(): Field {
    return Field.createArrayField(ReferenceName, Description, EntityName, false, true)
  }

  public property get CoverableEntityName(): String {
    return Coverable.EntityName
  }

  public property get CoverageEntityName(): String {
    return Coverage.EntityName
  }

  public property get SuperEntity(): String {
    return ParentCost.EntityName
  }

  /**
   * @return Foreign key field to {@literal CoverableEntityName}
   */
  public property get CoverableFkField(): Field {
    var fkField = FieldBuilder.createBuilder()
        .withName(Coverable.EntityNameWithoutSuffix)
        .withColumnType(Foreignkey)
        .withFkEntity(CoverableEntityName)
        .withExportable(true)
        .withNullOk(false)
        .build()
    return fkField
  }

  /**
   * @return Foreign key field to {@literal CoverageEntityName}
   */
  public property get CoverageFkField(): Field {
    return Coverage.asReferenceFkField
  }

  public property get AttachToCoverable(): boolean {
    return Coverable != null
  }

  /**
   * @return implementation class name for CostMethods interface
   */
  override property get CostMethodsImplName(): String {
    return "${Coverable.EntityNameWithoutSuffix}CostMethodsImpl"
  }

  /**
   * @return true if coverage's coverable is line i.e this cost has line level coverage, false otherwise
   */
  public property get HasLineCoverage(): boolean {
    return Coverage != null and Coverage.IsLineCoverage
  }

  /**
   * @return true if coverable for this cost is line, false otherwise
   */
  public property get HasLineCoverable(): boolean {
    return Coverable != null and Coverable typeis ProductLine
  }

  /**
   * @return true if ancestor costs's coverage's coverable is line, false otherwise
   */
  public property get InheritsLineCoverage(): boolean {
    if (ParentCost typeis gw.acc.npg.model.Cost) {
      //if parent coverage's coverable is line
      return ParentCost.HasLineCoverage or ParentCost.InheritsLineCoverage
    }
    return false
  }

  /**
   * @return true if ancestor costs's coverable's is line, false otherwise
   */
  public property get InheritsLineCoverable(): boolean {
    if (ParentCost typeis gw.acc.npg.model.Cost) {
      //if parent coverable is line
      return ParentCost.HasLineCoverable or ParentCost.InheritsLineCoverable
    }
    return false
  }

  public property get InheritedLineCoverage(): gw.acc.npg.model.Coverage {
    if (ParentCost typeis gw.acc.npg.model.Cost) {
      if (ParentCost.HasLineCoverage) {
        return ParentCost.Coverage
      } else {
        return ParentCost.InheritedLineCoverage
      }
    }
    return null
  }

  public property get InheritedLineCoverageFk(): Field {
    if (ParentCost typeis gw.acc.npg.model.Cost) {
      if (ParentCost.HasLineCoverage) {
        return ParentCost.CoverageFkField
      } else {
        return ParentCost.InheritedLineCoverageFk
      }
    }
    return null
  }

  public property get InheritedLineCoverableFk(): Field {
    if (ParentCost typeis gw.acc.npg.model.Cost) {
      if (ParentCost.HasLineCoverable) {
        return ParentCost.CoverableFkField
      } else {
        return ParentCost.InheritedLineCoverableFk
      }
    }
    return null
  }


  override property get CoverableInHierarchy(): gw.acc.npg.model.Coverable {
    if (Coverable != null) {
      return Coverable
    }
    return ParentCost.CoverableInHierarchy
  }

  override property get CoverageInHierarchy(): gw.acc.npg.model.Coverage {
    if (Coverage != null) {
      return Coverage
    }
    return ParentCost.CoverageInHierarchy
  }

  override property get CostDataImplName(): String {
    return "${EntityNameWithoutSuffix}Data"
  }

  property get BaseCostDataImplName(): String {
    return super.CostDataImplName
  }

  /**
   * @return foreign key field to this cost
   */
  override public function asReferenceFkField(): Field {
    var field = super.asReferenceFkField()
    field.Exportable = true
    return field
  }

  override function accept(visitor: IModelVisitor) {
    visitor.visit(this)
    this.AdditionalFields.each(\field -> {
      field.accept(visitor)
    })
  }
}