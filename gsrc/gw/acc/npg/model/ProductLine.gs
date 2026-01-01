package gw.acc.npg.model

uses gw.acc.npg.validators.IModelVisitor
uses gw.api.util.LocaleUtil

/**
 * Model for holding all information about new line of business.
 * This model helps to populate entities and gosu source related to new lob.
 */
class ProductLine extends gw.acc.npg.model.Coverable {

  private final var _lang = LocaleUtil.getDefaultLanguageType().Code
  private var _productCode: String as ProductCode
  private var _lineCode: String as LineCode
  private var _baseCost: BaseCost as BaseCost
  private var _transaction: gw.acc.npg.model.Transaction as Transaction
  private var _otherEntities: List<OtherEntity>as OtherEntities

  /**
   * @return implementation class name for {@link gw.api.policy.PolicyLineMethods}
   */
  property get PolicyLineMethodsImplName(): String {
    return "${Abbrevation}PolicyLineMethods"
  }

  /**
   * @return name for coverage array column
   */
  override property get CoverageArrayColumnName(): String {
    return "${Abbrevation}LineCoverages"
  }

  /**
   * @return name for condition array column
   */
  override property get ConditionArrayColumnName(): String {
    return "${Abbrevation}LineConditions"
  }


  /**
   * @return name for exclusion array column
   */
  override property get ExclusionArrayColumnName(): String {
    return "${Abbrevation}LineExclusions"
  }

  /**
   * @return name for modifier array column
   */
  override property get ModifierArrayColumnName(): String {
    return "${Abbrevation}LineModifiers"
  }

  /**
   * @return array column name for line level costs
   */
  property get LineCostArrayColumnName(): String {
    return "${Abbrevation}Costs"
  }

  property get TransactionArrayColumnName(): String {
    return "${Abbrevation}Transactions"
  }

  property get LineCostArrayEntityName(): String {
    return "${Abbrevation}Cost${Suffix}"
  }

  override property get ConditionsArrayField(): Field {
    return Field.createArrayField(ConditionArrayColumnName, "Line-level conditions for ${EntityDisplayName}",
        Condition.EntityName, false, true)
  }

  override property get ExclusionsArrayField(): Field {
    return Field.createArrayField(ExclusionArrayColumnName, "Line-level exclusions for ${EntityDisplayName}",
        Exclusion.EntityName, false, true)
  }

  override property get ModifiersArrayField(): Field {
    return Field.createArrayField(ModifierArrayColumnName, "Line-level modifiers for ${EntityDisplayName}",
        Modifier.EntityName, false, true)
  }


  override property get PathToReinsurable(): String {
    return ""
  }

  override property get ReinsurableIsWholePolicy(): boolean {
    return true
  }

  override property get CoverageArrayField(): Field {
    return Field.createArrayField(CoverageArrayColumnName, "Line-level coverages for ${EntityDisplayName}",
        Coverage.EntityName, false, true)
  }

  override property get EntityDisplayName(): String {
    return LineDisplayName
  }

  property get RatingEngineName(): String {
    return "${Abbrevation}RatingEngine"
  }

  property get RateRoutineConfigName(): String {
    return "${Abbrevation}RateRoutineConfig"
  }

  property get QuoteDisplayUtilName(): String {
    return "${Abbrevation}QuoteDisplayUtil"
  }

  property get ValidationName(): String {
    return "${Abbrevation}LineValidation"
  }

  property get DiffHelperName(): String {
    return "${Abbrevation}DiffHelper"
  }

  property get InstalledPolicyLineName(): String {
    return "InstalledPolicyLine"
  }

  override property get PathToLine(): String {
    return ""
  }

  override property get JurisBasedOnLocation(): boolean {
    return false
  }

  override property get PathToJurisdiction(): String {
    return "BaseState"
  }

  property get DiffTreeName(): String {
    return "${Abbrevation}DiffTree"
  }

  property get LineWizardName(): String {
    return "LineWizardStepSet.${ProductCode}"
  }

  property get DisplayPropertiesName(): String {
    return "display_${_lang}.properties"
  }

  property get ProductModelDisplayPropertiesName(): String {
    return "productmodel.display_${_lang}.properties"
  }

  property get AllCosts(): List<BaseCost> {
    var costs = new ArrayList<BaseCost>()
    costs.addAll(Costs)
    Coverables.each(\coverable -> {
      costs.addAll(coverable.Costs)
    })
    return costs
  }

  property get LineCoveragesScreenName(): String {
    return "${EntityNameWithoutSuffix}CoveragesScreen"
  }

  property get LineStandardCoveragesDVName(): String {
    return "${EntityNameWithoutSuffix}StandardCoveragesDV"
  }

  property get RatingOverrideCostLVName(): String {
    return "${Abbrevation}RatingOverrideCostLV"
  }

  property get PolicyLineSummaryPanelSetName(): String {
    return "PolicyLineSummaryPanelSet"
  }

  property get RatingCumulDetailsPanelSetName(): String {
    return "RatingCumulDetailsPanelSet"
  }

  property get RatingOverridePanelSetName(): String {
    return "RatingOverridePanelSet"
  }

  property get RatingTxDetailsPanelSetName(): String {
    return "RatingTxDetailsPanelSet"
  }

  property get PolicyFileFormsName(): String {
    return "PolicyFile_Forms_${Abbrevation}"
  }

  property get PolicyFileLineCoveragesName(): String {
    return "PolicyFile_${EntityNameWithoutSuffix}Coverages"
  }

  property get PolicyMenuItemSetName(): String {
    return "PolicyMenuItemSet"
  }

  property get ProductLookupsName(): String {
    return "${ProductCode}-lookups"
  }

  property get PolicyLineLookupsName(): String {
    return "${LineCode}-lookups"
  }

  property get LookupTablesName(): String {
    return "lookuptables"
  }

  property get CCPolicyLineMapperName(): String {
    return "CC${Abbrevation}PolicyLineMapper"
  }

  property get CCPolicyGeneratorName(): String {
    return "CCPolicyGenerator"
  }

  property get LineConfigurationName(): String {
    return "${Abbrevation}Configuration"
  }

  property get LineTypeKey(): String {
    return "TC_${Abbrevation}"
  }

  property get PolicyPeriodName(): String {
    return "PolicyPeriod"
  }

  override function accept(visitor: IModelVisitor) {
    visitor.visit(this)
    this.Coverage.accept(visitor)
    this.Coverables.each(\coverable -> {
      coverable.accept(visitor)
    })
    this.Costs.each(\cost -> {
      cost.accept(visitor)
    })
    this.BaseCost.accept(visitor)
    this.Transaction.accept(visitor)
    this.OtherEntities.each(\entity -> {
      entity.accept(visitor)
    })
    this.AdditionalFields.each(\field -> {
      field.accept(visitor)
    })
  }
}