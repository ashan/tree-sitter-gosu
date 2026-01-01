package gw.acc.npg.model

uses gw.acc.npg.builders.FieldBuilder
uses gw.acc.npg.validators.IModelVisitor

/**
 * Model for holding all information about coverable in new line of business.
 * This model helps to populate entities and gosu source related to coverable
 */
class Coverable extends BaseProductModel {

  private var _entityName: String as EntityName
  private var _description: String as Description
  private var _referenceName: String as ReferenceName
  private var _refereredFrom: String as ReferredFrom
  private var _attachToLocation: boolean as AttachToLocation
  private var _attachToBuilding: boolean as AttachToBuilding
  private var _includeCondition: boolean as IncludeCondition
  private var _includeExclusion: boolean as IncludeExclusion
  private var _includeModifier: boolean as IncludeModifier
  private var _coverables: List<gw.acc.npg.model.Coverable>as Coverables
  private var _costs: List<gw.acc.npg.model.Cost>as Costs
  private var _addtionalFields: List<Field>as AdditionalFields
  private var _modifier: gw.acc.npg.model.Modifier as Modifier
  private var _condition: Condition as Condition
  private var _exclusion: gw.acc.npg.model.Exclusion as Exclusion
  private var _rateFactor: gw.acc.npg.model.RateFactor as RateFactor
  private var _coverage: gw.acc.npg.model.Coverage as Coverage
  private var _referredFromCoverable: gw.acc.npg.model.Coverable as ReferredFromCoverable
  private static final var REGEX_SPLIT_BY_CAPITALIZATION = "(?<!(^|[A-Z]))(?=[A-Z])|(?<!^)(?=[A-Z][a-z])"

  public function asReferenceArrayField(): Field {
    return Field.createArrayField(ReferenceName, Description, EntityName, false, true)
  }

  public function asReferenceFkField(): Field {
    var field = FieldBuilder.createBuilder()
        .withFkEntity(EntityName)
        .withName(EntityNameWithoutSuffix)
        .withDescription(EntityDisplayName)
        .withNullOk(false)
        .withExportable(true)
        .withColumnType(Foreignkey)
        .build()
    return field
  }

  property get TableName(): String {
    return EntityName.toLowerCase()
  }

  property get CoverableModifiableAdapterImplName(): String {
    return "${EntityNameWithoutSuffix}CoverableModifiableAdapter"
  }

  property get CoverableAdapterImplName(): String {
    return "${EntityNameWithoutSuffix}CoverableAdapter"
  }

  property get ModifiableAdapterImplName(): String {
    return "${EntityNameWithoutSuffix}ModifiableAdapter"
  }

  /**
   * @return Fk to ReferredFrom field
   */
  property get ReferredFromField(): Field {
    var field = FieldBuilder.createBuilder().withFkEntity(ReferredFrom)
        .withName(removeSuffix(ReferredFrom))
        .withNullOk(false)
        .withExportable(true)
        .withColumnType(Foreignkey)
        .build()
    return field
  }

  property get VersionListName(): String {
    return "${EntityName}VersionList"
  }

  /**
   * @return name for coverage array column
   */
  property get CoverageArrayColumnName(): String {
    return "Coverages"
  }

  property get CoverageArrayField(): Field {
    return Field.createArrayField(CoverageArrayColumnName, "Coverages directly attached to ${EntityDisplayName}",
        Coverage.EntityName, false, true)
  }

  property get BuildingEntityName(): String {
    return "Building"
  }

  /**
   * @return FK to Building
   */
  property get BuildingsFkField(): Field {
    return FieldBuilder.createBuilder()
        .withFkEntity(BuildingEntityName)
        .withName(BuildingEntityName)
        .withDescription("Building directly attached to ${EntityDisplayName}")
        .withColumnType(Foreignkey)
        .withExportable(true)
        .withNullOk(true)
        .build()
  }

  property get LocationEntityName(): String {
    return "PolicyLocation"
  }

  /**
   * @return FK to Location
   */
  property get LocationFkField(): Field {
    return FieldBuilder.createBuilder()
        .withFkEntity(LocationEntityName)
        .withName(LocationEntityName)
        .withDescription("Location directly attached to ${EntityDisplayName}")
        .withColumnType(Foreignkey)
        .withExportable(true)
        .withNullOk(true)
        .build()
  }

  /**
   * @return name for condition array column
   */
  property get ConditionArrayColumnName(): String {
    return "Conditions"
  }

  property get ConditionsArrayField(): Field {
    return Field.createArrayField(ConditionArrayColumnName, "Conditions directly attached to ${EntityDisplayName}",
        Condition.EntityName, false, true)
  }


  /**
   * @return name for exclusion array column
   */
  property get ExclusionArrayColumnName(): String {
    return "Exclusions"
  }


  property get ExclusionsArrayField(): Field {
    return Field.createArrayField(ExclusionArrayColumnName, "Exclusions directly attached to ${EntityDisplayName}",
        Exclusion.EntityName, false, true)
  }


  /**
   * @return name for modifier array column
   */
  property get ModifierArrayColumnName(): String {
    return "Modifiers"
  }


  property get ModifiersArrayField(): Field {
    return Field.createArrayField(ModifierArrayColumnName, "Modifiers directly attached to ${EntityDisplayName}",
        Modifier.EntityName, false, true)
  }

  /**
   * @return entityName after removing suffix if any
   */
  property get EntityNameWithoutSuffix(): String {
    return removeSuffix(EntityName)
  }


  property get PathToLine(): String {
    if (ReferredFromCoverable == null) {
      return ""
    }
    if (ReferredFromCoverable typeis ProductLine) {
      return ReferredFromField.Name
    }
    return "${ReferredFromField.Name}.${ReferredFromCoverable.PathToLine}"
  }

  property get PathFromLine(): String {
    if (ReferredFromCoverable == null) {
      return ""
    }
    if (ReferredFromCoverable typeis ProductLine) {//if Referred from line
      return ReferenceName
    }
    return "${ReferredFromCoverable.PathFromLine}*.${ReferenceName}"
  }

  property get JurisBasedOnLocation(): boolean {
    if (AttachToLocation or AttachToBuilding) {
      return true
    } else {  // Ask the referred from coverable
      return ReferredFromCoverable.JurisBasedOnLocation
    }
  }

  property get PathToJurisdiction(): String {
    if (AttachToLocation) { // Get the state from the building
      return LocationEntityName
    } else if (AttachToBuilding) { // Get the state from the building's location
      return "${BuildingEntityName}.PolicyLocation"
    } else {  // Ask the parent coverable
      return "${ReferredFromField.Name}.${ReferredFromCoverable.PathToJurisdiction}"
    }
  }

  property get ReinsurableIsWholePolicy(): boolean {
    if (AttachToLocation or AttachToBuilding) {
      return false
    } else {  // Ask the referred from coverable
      return ReferredFromCoverable.ReinsurableIsWholePolicy
    }
  }

  property get PathToReinsurable(): String {
    if (AttachToLocation) {
      return LocationEntityName
    } else if (AttachToBuilding) {
      return "${BuildingEntityName}.PolicyLocation"
    } else if (not ReinsurableIsWholePolicy) {  // Ask the referred from coverable
      return "${ReferredFromField.Name}.${ReferredFromCoverable.PathToReinsurable}"
    }
    return ""
  }

  property get AutoNumberSeqFKName(): String {
    return "${EntityNameWithoutSuffix}Seq"
  }

  property get AutoNumberFieldName(): String {
    var autoNumberField = AdditionalFields.firstWhere(\field -> field.Type == AutoNumber)
    return autoNumberField.Name
  }

  property get IsAutoNumbered(): boolean {
    return AdditionalFields.countWhere(\field -> field.Type == AutoNumber) > 0
  }

  public function asAutoNumberFkField(): Field {
    return FieldBuilder.createBuilder()
        .withFkEntity("AutoNumberSequence")
        .withName(AutoNumberSeqFKName)
        .withDescription("Sequence to autonumber ${EntityNameWithoutSuffix} coverables")
        .withColumnType(Foreignkey)
        .withNullOk(true)
        .build()
  }

  property get EnhancementName(): String {
    return "${EntityNameWithoutSuffix}Enhancement"
  }

  property get CoverableScreenName(): String {
    return "${EntityNameWithoutSuffix}Screen"
  }

  property get PolicyFileName(): String {
    return "PolicyFile_${EntityNameWithoutSuffix}"
  }

  property get CoverableCoveragesDVName(): String {
    return "${EntityNameWithoutSuffix}CoveragesDV"
  }

  property get CoverableDetailsDVName(): String {
    return "${EntityNameWithoutSuffix}DetailsDV"
  }

  property get CoverablePanelSetName(): String {
    return "${EntityNameWithoutSuffix}PanelSet"
  }

  property get StndGroupName(): String {
    return "${EntityNameWithoutSuffix}StndGrp"
  }

  property get AddGroupName(): String {
    return "${EntityNameWithoutSuffix}AddGrp"
  }

  property get ExclusionGroupName(): String {
    return "${EntityNameWithoutSuffix}ExclGrp"
  }

  property get ConditionGroupName(): String {
    return "${EntityNameWithoutSuffix}CondGrp"
  }

  property get PolicyFileCoverableName(): String {
    return "PolicyFile_${EntityNameWithoutSuffix}"
  }

  property get PolicyFileCoverableScreenName(): String {
    return "PolicyFile_${EntityNameWithoutSuffix}Screen"
  }

  property get EntityDisplayName(): String {// This can be display name if don't want to ask user to enter
    return EntityNameWithoutSuffix.split(REGEX_SPLIT_BY_CAPITALIZATION).join(" ")
  }

  override function accept(visitor: IModelVisitor) {
    visitor.visit(this)
    this.Coverage.accept(visitor)
    this.Costs.each(\cost -> {
      cost.accept(visitor)
    })
    if (IncludeExclusion) {
      Exclusion.accept(visitor)
    }
    if (IncludeModifier) {
      Modifier.accept(visitor)
      this.RateFactor.accept(visitor)
    }
    if (IncludeCondition) {
      Condition.accept(visitor)
    }
    this.AdditionalFields.each(\field -> {
      field.accept(visitor)
    })
  }
}