package gw.policy

uses gw.api.database.Query
uses gw.api.domain.covterm.BooleanCovTerm
uses gw.api.database.Relop
uses gw.api.domain.covterm.CovTerm
uses gw.api.domain.covterm.DirectCovTerm
uses gw.api.domain.covterm.GenericCovTerm
uses gw.api.domain.covterm.OptionCovTerm
uses gw.api.domain.covterm.PackageCovTerm
uses gw.api.domain.covterm.TypekeyCovTerm
uses gw.api.domain.rules.SyncableAdapter
uses gw.api.locale.DisplayKey
uses gw.api.productedition.APDMinMaxRulesHelper
uses gw.api.productedition.ProductEditionKey
uses gw.api.productedition.ProductEditionService
uses gw.api.productedition.ProductModelClassProductEditionKey
uses gw.api.productedition.PropertyProductEditionKey
uses gw.api.productedition.field.SyncableField
uses gw.api.productedition.field.SyncableFieldType
uses gw.api.system.PCDependenciesGateway
uses gw.plugin.exchangerate.IFXRatePlugin
uses gw.validation.PCValidationBase
uses gw.validation.PCValidationContext
uses nz.co.acc.lob.util.ModifiersUtil_ACC
uses entity.PolicyLine

uses java.math.BigDecimal
/**
 * Base implementation for {@link gw.validation.PCValidation PCValidation} for {@link PolicyLine PolicyLines}
 */
@Export
abstract class PolicyLineValidation<T extends PolicyLine> extends PCValidationBase {

  final static var TEMP_HOLDER_REQUIRED_FOR_STRING = "xxxxx"

  var _line : T as Line

  /**
   * @param valContext a context to store validation issues
   * @param polLine the policy line to validate
   */
  construct(valContext : PCValidationContext, polLine : T) {
    super(valContext)
    _line = polLine
  }

  /**
   * Call validations that should be done for all policy lines.
   */
  final override function validateImpl() {
    if (not Context.addToVisited( this, "validateImpl")) {
      return
    }
    checkSchedulesAreNotEmpty()
    checkCoverageAndSettlementCurrenciesCompatible()
    checkCoverageCurrenciesOnEachCoverableAreSelfConsistent()
    checkAffinityGroupSelectedIsWithinPolicyTerm()
    checkAffinityGroupSelectedIsAvailableInPolicyPeriodBaseState()
    checkRequiredByRules(_line)
    doValidate()
  }

  /**
   * Call validations that should be done for particular policy lines.
   */
  abstract function doValidate()

  /**
   * Call validations that should be done for a policy line in an Audit job.
   * These validations will namely involve audit amounts and temps.
   */
  final function validateForAudit() {
    if ( not ( Line.Branch.Job typeis Audit ) ) {
      throw DisplayKey.get("Validator.ForAuditOnlyError")
    }
    validateLineForAudit()
  }

  /**
   * This call should be implemented by any line using audit.
   */
  abstract protected function validateLineForAudit()

  /**
   * This function should be implemented by any line using audit.
   */
  protected function validateCoveragesForAudit_ACC() {
    throw new UnsupportedOperationException(DisplayKey.get("Validator_ACC.UnsupportedAuditCoveragesError"))
  }
  /**
   * This function should be implemented by any line using earnings information.
   */
  protected function checkEarnings_ACC(){
    throw new UnsupportedOperationException(DisplayKey.get("Validator_ACC.UnsupportedCheckEarningsError"))
  }

  protected function validateLineForAudit_ACC() {
    Context.addToVisited(this, "validateLineForAudit_ACC")

    var audit = Line.Branch.Job as Audit
    if (audit.AuditInformation.ReceivedDate == null) {
      Context.Result.addError(Line, ValidationLevel.TC_DEFAULT, DisplayKey.get("Web.PolicyLine.Validation.FinalAuditNoReceivedDate_ACC"))
    }
    if(audit.AuditInformation.ReceivedDate != null and not audit.AuditInformation.ReceivedDate.trimToMidnight().afterOrEqual(audit.AuditInformation.InitDate.trimToMidnight())) {
      Context.Result.addError(Line, ValidationLevel.TC_DEFAULT, DisplayKey.get("Web.PolicyLine.Validation.FinalAuditWrongReceivedDate_ACC"))
    }
  }

  /**
   * Ensure that each schedule has at least one scheduled item.  In the current context, set an error
   * if quoting, otherwise a warning if these conditions are not met.
   */
  protected function checkSchedulesAreNotEmpty() {
    Context.addToVisited(this, "checkSchedulesAreNotEmpty")
    var allSchedules = Line.AllSchedules
    allSchedules.each(\ s -> {
      if (s.ScheduledItems.IsEmpty){
        if (Context.isAtLeast(ValidationLevel.TC_QUOTABLE)) {
          Context.Result.addError(Line, ValidationLevel.TC_QUOTABLE, DisplayKey.get("Web.Policy.Schedule.Validation.AtLeastOneItemInSchedule", s.ScheduleName))
        } else {
          Context.Result.addWarning(Line, ValidationLevel.TC_DEFAULT, DisplayKey.get("Web.Policy.Schedule.Validation.AtLeastOneItemInSchedule", s.ScheduleName))
        }
      }
    })
  }

  /**
   * Ensure that the exchange rates between the coverage currencies (default and instantiated) and the settlement
   * currency are available
   */
  private function checkCoverageAndSettlementCurrenciesCompatible() {
    var fxPlugin = PCDependenciesGateway.getPluginConfig().getPlugin(IFXRatePlugin)
    var settlementCurrency = Line.Branch.PreferredSettlementCurrency
    var coverageCurrencies = Line.AllCoverages*.Currency.toSet()

    coverageCurrencies.each(\currency -> {
      if (!fxPlugin.canConvert(currency, settlementCurrency)) {
        Result.addError(Line, ValidationLevel.TC_DEFAULT, DisplayKey.get("Web.PolicyLine.Validation.CurrencyExchangeUnsupported", currency.Code, settlementCurrency.Code), "Currency")
      }
    })
  }

  /**
  * As configured from Guildewire, there is an assumption in the UI that all coverage currencies on a coverable are the
   * same.  This validation check ensures that this assumption is not violated.
   * If the UI is reconfigured to display and manage multiple currencies per coverable, this validation will no longer
   * be necessary
  */
  private function checkCoverageCurrenciesOnEachCoverableAreSelfConsistent() {
    for (coverable in Line.AllCoverables) {
      var currencies = new HashSet()
      for (coverage in coverable.CoveragesFromCoverable) {
        currencies.add(coverage.Currency)
        if (currencies.size() > 1) {
          Result.addError(Line, ValidationLevel.TC_DEFAULT, DisplayKey.get("Web.PolicyLine.Validation.CoverageCurrenciesInconsistentForCoverage"))
          return
        }
      }
    }
  }

  /**
  * This validation check ensures affinity group selected is effective during the policy term.
   */
  private function checkAffinityGroupSelectedIsWithinPolicyTerm() {
    var affinityGroup = Line.Branch.PolicyTerm.AffinityGroup

    if (affinityGroup != null) {
      if (affinityGroup.StartDate > Line.Branch.EditEffectiveDate or affinityGroup.EndDate < Line.Branch.PeriodEnd) {
        Result.addError(Line, ValidationLevel.TC_QUOTABLE, DisplayKey.get("Web.PolicyLine.Validation.AffinityGroupDatesOutOfBound", affinityGroup.Name))
      }
    }
  }

  /**
   * This validation check ensures affinity group selected is available in base state of policy period.
   */
  private function checkAffinityGroupSelectedIsAvailableInPolicyPeriodBaseState() {
    var affinityGroup = Line.Branch.PolicyTerm.AffinityGroup

    if (affinityGroup != null) {
      var affinityGroupJurisdictions = affinityGroup.Jurisdictions.map(\ affinityGroupJurisdiction -> affinityGroupJurisdiction.Jurisdiction)
      if (not affinityGroupJurisdictions.IsEmpty and not affinityGroupJurisdictions.contains(Line.Branch.BaseState)) {
        Result.addError(Line, ValidationLevel.TC_QUOTABLE, DisplayKey.get("Web.PolicyLine.Validation.AffinityGroupSelectedIsUnavailableInPolicyPeriodBaseState", affinityGroup.Name, Line.Branch.BaseState))
      }
    }
  }

  private function checkBICCodePresentInDatabase_ACC(biccode : PolicyLineBusinessClassificationUnit_ACC) {
    if(biccode.BICCode.HasContent) {
      var query = Query.make(BusinessIndustryCode_ACC)
      query.compare("BusinessIndustryCode", Relop.Equals, biccode.BICCode)
      if(!query.select().HasElements){
        this.Result.addError(this.Line, TC_QUOTABLE, DisplayKey.get("Web.PolicyLine.Validation.BICdoesNotExist_ACC", biccode?.CUCode))
      }
    }
  }

  protected function hasValidBICCodePercentage_ACC(bicCodes : PolicyLineBusinessClassificationUnit_ACC[]) : boolean {
    Context.addToVisited(this, "hasValidBICCodePercentage_ACC")
    var sum = BigDecimal.ZERO

    if (bicCodes.length > 0) {
      for (bicCode in bicCodes) {
        sum += bicCode.Percentage ?: 0
      }

      if (sum != 100) {
        return false
      }
    }
    return true
  }

  protected function checkBICCodes_ACC() {
    Context.addToVisited(this, "checkBICCodes_ACC")

    var hasAtLeastOneBICSet = this.Line.BICCodes.HasElements and this.Line.BICCodes.hasMatch(\elt -> elt.BICCode.HasContent)

    if(hasAtLeastOneBICSet){
      var bicList = this.Line.BICCodes*.BICCode.toList()
      if(bicList.Count > bicList.toSet().Count){
        this.Result.addError(this.Line, TC_DEFAULT, DisplayKey.get("Web.PolicyLine.Validation.BICsAreNotUnique_ACC", bicList))
      }
      for(bic in this.Line.BICCodes){
        checkBICCodePresentInDatabase_ACC(bic)
      }
    }
  }

  protected function checkCUCodes_ACC() {
    Context.addToVisited(this, "checkCUCodes_ACC")

    if(!this.Line.BICCodes.HasElements or this.Line.BICCodes.hasMatch(\elt -> !elt.CUCode.HasContent)){
      this.Result.addError(this.Line, TC_DEFAULT, DisplayKey.get("Web.PolicyLine.Validation.NoCUCodeSet_ACC"))
    }

  }

  protected function checkFieldMinMaxAmount(fieldName : String, amount : BigDecimal, lowerLimit:BigDecimal, upperLimit:BigDecimal, canBeBlank : boolean = false) {
    if (!Line.Branch.Migrated_ACC) {
      if (!canBeBlank and amount == null) {
        Result.addError(Line, ValidationLevel.TC_DEFAULT, DisplayKey.get("Web.PolicyLine.Validation.LiableEarnings_ACC.FieldIsBlank", fieldName))
        return
      }
      if (amount != null and amount < lowerLimit or amount > upperLimit) {
        Result.addError(Line, TC_DEFAULT, DisplayKey.get("Web.PolicyLine.Validation.LiableEarnings_ACC.FieldAmountMustBeBetween", fieldName, lowerLimit, upperLimit))
      }
    }
  }

  /**
   * Validate that the discounts applied modifiers, if enabled, have dates
   */
  protected function checkDiscountsAppliedModifiersHaveDates_ACC() {
    var modifiers = ModifiersUtil_ACC.getAllDiscountsAppliedModifiers(this.Line.AssociatedPolicyPeriod)
    modifiers.each(\mod -> {
      if (mod.BooleanModifier != null and mod.BooleanModifier and mod.StartEndDate.EffectiveExpirationDate?.length == 0) {
        Result.addError(Line, TC_DEFAULT, DisplayKey.get("Web.PolicyLine.Validation.Modifiers.DiscountsApplied.MissingDates_ACC", mod.DisplayName))
      }
    })
  }

  private function checkRequiredByRules(line : PolicyLine) {
    if (line typeis SyncableAdapter) {
      var syncableEffDateds : List<SyncableAdapter> = {line}

      while (syncableEffDateds.HasElements) {
        var syncableEffDated = syncableEffDateds.remove(0)

        syncableEffDated.SyncableFields.each(\field -> {
          var effDated = syncableEffDated.Owner
          var productEditionKey = new PropertyProductEditionKey(effDated, field.PropertyInfo)
          var value = field.getValue(effDated)
          var errorMessage = DisplayKey.get("Web.Policy.PolicyPeriod.Validation.Field.MissingRequired", field.Label, TEMP_HOLDER_REQUIRED_FOR_STRING);
          var selectableTypes = {SyncableFieldType.TYPEKEY, SyncableFieldType.BOOLEAN, SyncableFieldType.LOCATION, SyncableFieldType.PARTY}
          if (selectableTypes.contains(field.Type)) {
            errorMessage += " " + DisplayKey.get("Web.Policy.PolicyPeriod.Validation.MissingRequired.SelectValue")
          } else {
            errorMessage += " " + DisplayKey.get("Web.Policy.PolicyPeriod.Validation.MissingRequired.EnterValue")
          }
          checkRequiredFieldByRules(line, effDated, productEditionKey, value, errorMessage)
          checkFieldAgainstMinMaxRules(line, effDated, field, value)
        })

        syncableEffDateds.addAll(syncableEffDated.SyncableChildren)
      }
    }

    for (coverable in line.AllCoverables) {
      for (clause in coverable.CoveragesConditionsAndExclusionsFromCoverable) {
        for (term in clause.CovTerms) {
          var productEditionKey = new ProductModelClassProductEditionKey(term.Pattern)

          var termRequiredForDisplayKey : String
          if (clause.Pattern.EntityType == gw.api.productmodel.CoveragePattern) {
            termRequiredForDisplayKey = "Web.Policy.PolicyPeriod.Validation.CovTerm.MissingRequired.Coverage"
          } else if (clause.Pattern.EntityType == gw.api.productmodel.ConditionPattern) {
            termRequiredForDisplayKey = "Web.Policy.PolicyPeriod.Validation.CovTerm.MissingRequired.Condition"
          } else if (clause.Pattern.EntityType == gw.api.productmodel.ExclusionPattern) {
            termRequiredForDisplayKey = "Web.Policy.PolicyPeriod.Validation.CovTerm.MissingRequired.Exclusion"
          } else {
            termRequiredForDisplayKey = "Web.Policy.PolicyPeriod.Validation.CovTerm.MissingRequired"
          }

          var errorMessage = DisplayKey.get(termRequiredForDisplayKey, clause.Pattern, term.Pattern, TEMP_HOLDER_REQUIRED_FOR_STRING);
          if (term typeis TypekeyCovTerm || term typeis OptionCovTerm || term typeis PackageCovTerm || term typeis BooleanCovTerm) {
            errorMessage += " " + DisplayKey.get("Web.Policy.PolicyPeriod.Validation.MissingRequired.SelectValue")
          } else {
            errorMessage += " " + DisplayKey.get("Web.Policy.PolicyPeriod.Validation.MissingRequired.EnterValue")
          }
          checkRequiredFieldByRules(line, coverable, productEditionKey, getCovTermValue(term), errorMessage)
        }
      }
    }
  }

  private function checkRequiredFieldByRules(
      policyLine : PolicyLine, effDated : EffDated, productEditionKey : ProductEditionKey, value : Object, errorMessage : String
  ) {
    var productEditionService = ProductEditionService.Instance
    var isRequired = false
    if (Context.isAtLeast(ValidationLevel.TC_QUOTABLE)) {
      isRequired = productEditionService
          .evaluateRequiredForQuoteRules(policyLine, effDated, productEditionKey).Result
      if (isRequired == Boolean.TRUE && value == null) {
        var textReplacedInErrorMessage = errorMessage.replace(TEMP_HOLDER_REQUIRED_FOR_STRING,
            DisplayKey.get("Web.Policy.PolicyPeriod.Validation.MissingRequired.RequiredForQuote"))
        Context.Result.addError(effDated, ValidationLevel.TC_QUOTABLE, DisplayKey.get("Web.Policy.PolicyPeriod.Validation.ErrorMessage",
            effDated.DisplayName, textReplacedInErrorMessage))
      }
    }
    if (Context.isAtLeast(ValidationLevel.TC_BINDABLE)) {
      if (!isRequired) {
        isRequired = isRequired || productEditionService
            .evaluateRequiredForBindRules(policyLine, effDated, productEditionKey).Result
        if (isRequired == Boolean.TRUE && value == null) {
          var textReplacedInErrorMessage = errorMessage.replace(TEMP_HOLDER_REQUIRED_FOR_STRING,
              DisplayKey.get("Web.Policy.PolicyPeriod.Validation.MissingRequired.RequiredForBind"))
          Context.Result.addError(effDated, ValidationLevel.TC_BINDABLE, DisplayKey.get("Web.Policy.PolicyPeriod.Validation.ErrorMessage",
              effDated.DisplayName, textReplacedInErrorMessage))
        }
      }
    }
    if (Context.isAtLeast(ValidationLevel.TC_READYFORISSUE)) {
      if (!isRequired) {
        isRequired = isRequired || productEditionService
            .evaluateRequiredForIssueRules(policyLine, effDated, productEditionKey).Result
        if (isRequired == Boolean.TRUE && value == null) {
          var textReplacedInErrorMessage = errorMessage.replace(TEMP_HOLDER_REQUIRED_FOR_STRING,
              DisplayKey.get("Web.Policy.PolicyPeriod.Validation.MissingRequired.RequiredForIssue"))
          Context.Result.addError(effDated, ValidationLevel.TC_READYFORISSUE, DisplayKey.get("Web.Policy.PolicyPeriod.Validation.ErrorMessage",
              effDated.DisplayName, textReplacedInErrorMessage))
        }
      }
    }
  }

  private function checkFieldAgainstMinMaxRules(
      policyLine : PolicyLine, effDated : EffDated, field : SyncableField, value : Object
  ) {
    var errorMessage = ""
    switch (field.Type) {
      case INTEGER:
        errorMessage = validateValueInRange<Integer>(
            policyLine, effDated, field, value as Integer,
            "Web.Policy.PolicyPeriod.Validation.Number.MinimumNumber.Field", "Web.Policy.PolicyPeriod.Validation.Number.MaximumNumber.Field"
        )
        break
      case DECIMAL:
        errorMessage = validateValueInRange<BigDecimal>(
            policyLine, effDated, field, value as BigDecimal,
            "Web.Policy.PolicyPeriod.Validation.Number.MinimumNumber.Field", "Web.Policy.PolicyPeriod.Validation.Number.MaximumNumber.Field"
        )
        break
      case MONEY:
        errorMessage = validateValueInRange<BigDecimal>(
            policyLine, effDated, field, value as BigDecimal,
            "Web.Policy.PolicyPeriod.Validation.Number.MinimumNumber.Field", "Web.Policy.PolicyPeriod.Validation.Number.MaximumNumber.Field"
        )
        break
      case DATETIME:
        errorMessage = validateValueInRange<Date>(
            policyLine, effDated, field, value as Date,
            "Web.Policy.PolicyPeriod.Validation.Date.MinimumDate.Field", "Web.Policy.PolicyPeriod.Validation.Date.MaximumDate.Field",
            \ v -> (v as Date).ShortFormat
        )
        break
      default:
    }

    if (errorMessage.HasContent) {
      Context.Result.addInvariantError(effDated, errorMessage)
    }
  }

  private function getCovTermValue(term : CovTerm) : Object {
    if (term typeis DirectCovTerm) {
      return term.Value
    } else if (term typeis GenericCovTerm) {
      return term.Value
    } else if (term typeis TypekeyCovTerm) {
      return term.Value
    } else if (term typeis OptionCovTerm) {
      return term.OptionValue
    } else if (term typeis PackageCovTerm) {
      return term.PackageValue
    } else {
      throw new IllegalArgumentException("Unknown CovTerm subtype " + (typeof term).Name)
    }
  }

  private reified function validateValueInRange<G extends Comparable<G>>(
      policyLine : PolicyLine, effDated : EffDated, field : SyncableField, value : G,
      minRuleErrorDisplayKey : String, maxRuleErrorDisplayKey : String
  ) : String {
    return validateValueInRange<G>(policyLine, effDated, field, value, minRuleErrorDisplayKey, maxRuleErrorDisplayKey, \v -> v)
  }

  private reified function validateValueInRange<G extends Comparable<G>>(
      policyLine : PolicyLine, effDated : EffDated, field : SyncableField, value : G,
      minRuleErrorDisplayKey : String, maxRuleErrorDisplayKey : String,
      format : block(Object) : Object
  ) : String {
    var minVal = APDMinMaxRulesHelper.getMinVal<G>(policyLine, effDated, field.PropertyInfo)
    var maxVal = APDMinMaxRulesHelper.getMaxVal<G>(policyLine, effDated, field.PropertyInfo)

    if (minVal != null and minVal > value) {
      return DisplayKey.get(minRuleErrorDisplayKey, field.Label, format(minVal))
    } else if (maxVal != null and maxVal < value) {
      return DisplayKey.get(maxRuleErrorDisplayKey, field.Label, format(maxVal))
    }
    return null
  }
}
