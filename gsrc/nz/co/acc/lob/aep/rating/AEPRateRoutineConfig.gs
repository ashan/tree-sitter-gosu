package nz.co.acc.lob.aep.rating

uses gw.pc.rating.flow.util.InScopeUsageBase
uses gw.plugin.rateflow.IRateRoutineConfig
uses gw.plugin.rateflow.ICostDataWrapper

uses java.math.RoundingMode
uses java.lang.Integer

uses gw.plugin.rateflow.CostDataBase
uses gw.lang.reflect.IType
uses gw.rating.flow.domain.CalcRoutineCostDataWithTermOverride
uses gw.rating.CostDataWithOverrideSupport
uses gw.rating.flow.domain.CalcRoutineCostDataWithAmountOverride
uses gw.lang.reflect.IPropertyInfo
uses gw.pc.rating.flow.AvailableCoverageWrapper
uses gw.rating.flow.util.ItemFilter

@Export
class AEPRateRoutineConfig implements IRateRoutineConfig {

  // no-args constructor required
  construct() {
  }

  override function getCostDataWrapperType(paramSet: CalcRoutineParameterSet): IType {
    return CalcRoutineCostDataWithTermOverride
  }

  override function makeCostDataWrapper(
      paramSet: CalcRoutineParameterSet,
      costData: CostDataBase,
      defaultRoundingLevel: Integer,
      defaultRoundingMode: RoundingMode): ICostDataWrapper {

    return new CalcRoutineCostDataWithTermOverride(costData as CostDataWithOverrideSupport,
        CalcRoutineCostDataWithAmountOverride.OverrideMode.APPROXIMATE_STANDARD_RATES,
        defaultRoundingLevel,
        defaultRoundingMode)
  }

  override function worksheetsEnabledForLine(p0: String): boolean {
    return false
  }

  /***
   * This function give you override control for what fields on entities should be available to users in the rate routine editor.  By default,
   * it returns null, meaning that whether a field will be available or hidden depends on some default behavior set by Guidewire development.
   * Returning true or false allows you to override the default behavior in order to show fields that are normally hidden (return true) or hide
   * fields that are normally available (return false).
   */
  override function includeProperty(policyLinePatternCode: String, prop: IPropertyInfo): Boolean {
    return null
  }

  override function getCoverageWrappersForLine(linePatternCode: String): AvailableCoverageWrapper[] {
    return {}
  }

  override function filterIrrelevantItems(input: List<InScopeUsageBase>, policyLinePatternCode: String): List<InScopeUsageBase> {
    return ItemFilter.applyDefaultFilters(input)
  }
}