package gw.apd.model.generate.templates

@Export
class Templates {

  private static final var EXTENSION = true
  private static final var BASE = false
  private static final var DISCLAIMER = true
  private static final var NO_DISCLAIMER = false

  public static final var BASE_COST_ADAPTER : TemplateConfig = new TemplateConfig("productline.BaseCostAdapter", GOSU, BASE, DISCLAIMER)
  public static final var BASE_COST_ADAPTER_EXT : TemplateConfig = new TemplateConfig("productline.BaseCostAdapterExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var BASE_COST_DATA : TemplateConfig = new TemplateConfig("productline.BaseCostData", GOSU, BASE, DISCLAIMER)

  public static final var BASE_COST_METHODS : TemplateConfig = new TemplateConfig("productline.CostMethods", GOSU, BASE, DISCLAIMER)
  public static final var BASE_COST_METHODS_IMPL : TemplateConfig = new TemplateConfig("productline.BaseCostMethodsImpl", GOSU, BASE, DISCLAIMER)
  public static final var BASE_COST_METHODS_IMPL_EXT : TemplateConfig = new TemplateConfig("productline.BaseCostMethodsImplExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var CHARGE_BREAKDOWN_CATEGORY_LOOKUP : TemplateConfig = new TemplateConfig("productline.ChargeBreakdownCategoryLookup", GOSU, BASE, DISCLAIMER)
  public static final var CHARGE_BREAKDOWN_CATEGORY_LOOKUP_EXT : TemplateConfig = new TemplateConfig("productline.ChargeBreakdownCategoryLookupExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var CONDITION_ADAPTER : TemplateConfig = new TemplateConfig("coverable.ConditionAdapter", GOSU, BASE, DISCLAIMER)
  public static final var CONDITION_ADAPTER_EXT : TemplateConfig = new TemplateConfig("coverable.ConditionAdapterExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var CONDITION_MATCHER : TemplateConfig = new TemplateConfig("coverable.ConditionMatcher", GOSU, BASE, DISCLAIMER)
  public static final var CONDITION_MATCHER_EXT : TemplateConfig = new TemplateConfig("coverable.ConditionMatcherExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var CONFIGURATION : TemplateConfig = new TemplateConfig("productline.Configuration", GOSU, BASE, DISCLAIMER)

  public static final var COVERABLE_ADAPTER : TemplateConfig = new TemplateConfig("coverable.CoverableAdapter", GOSU, BASE, DISCLAIMER)
  public static final var COVERABLE_ADAPTER_EXT : TemplateConfig = new TemplateConfig("coverable.CoverableAdapterExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var COVERABLE_COST_DATA : TemplateConfig = new TemplateConfig("coverable.CoverableCostData", GOSU, BASE, DISCLAIMER)
  public static final var COVERABLE_COST_DATA_EXT : TemplateConfig = new TemplateConfig("coverable.CoverableCostDataExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var COVERABLE_COST_METHODS_IMPL : TemplateConfig = new TemplateConfig("coverable.CoverableCostMethodsImpl", GOSU, BASE, DISCLAIMER)
  public static final var COVERABLE_COST_METHODS_IMPL_EXT : TemplateConfig = new TemplateConfig("coverable.CoverableCostMethodsImplExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var COVERAGE_ADAPTER : TemplateConfig = new TemplateConfig("coverable.CoverageAdapter", GOSU, BASE, DISCLAIMER)
  public static final var COVERAGE_ADAPTER_EXT : TemplateConfig = new TemplateConfig("coverable.CoverageAdapterExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var COVERAGE_COST_DATA : TemplateConfig = new TemplateConfig("coverable.CoverageCostData", GOSU, BASE, DISCLAIMER)
  public static final var COVERAGE_COST_DATA_EXT : TemplateConfig = new TemplateConfig("coverable.CoverageCostDataExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var COVERAGE_COST_METHODS_IMPL : TemplateConfig = new TemplateConfig("coverable.CoverageCostMethodsImpl", GOSU, BASE, DISCLAIMER)
  public static final var COVERAGE_COST_METHODS_IMPL_EXT : TemplateConfig = new TemplateConfig("coverable.CoverageCostMethodsImplExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var COVERAGE_MATCHER : TemplateConfig = new TemplateConfig("coverable.CoverageMatcher", GOSU, BASE, DISCLAIMER)
  public static final var COVERAGE_MATCHER_EXT : TemplateConfig = new TemplateConfig("coverable.CoverageMatcherExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var DIFF_HELPER : TemplateConfig = new TemplateConfig("productline.DiffHelper", GOSU, BASE, DISCLAIMER)
  public static final var DIFF_HELPER_EXT : TemplateConfig = new TemplateConfig("productline.DiffHelperExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var EXCLUSION_ADAPTER : TemplateConfig = new TemplateConfig("coverable.ExclusionAdapter", GOSU, BASE, DISCLAIMER)
  public static final var EXCLUSION_ADAPTER_EXT : TemplateConfig = new TemplateConfig("coverable.ExclusionAdapterExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var EXCLUSION_MATCHER : TemplateConfig = new TemplateConfig("coverable.ExclusionMatcher", GOSU, BASE, DISCLAIMER)
  public static final var EXCLUSION_MATCHER_EXT : TemplateConfig = new TemplateConfig("coverable.ExclusionMatcherExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var LINE_ENTITY : TemplateConfig = new TemplateConfig("productline.LineEntity", ENTITY, BASE, NO_DISCLAIMER)

  public static final var LINE_TRANSACTION_ADAPTER : TemplateConfig = new TemplateConfig("productline.LineTransactionAdapter", GOSU, BASE, DISCLAIMER)
  public static final var LINE_TRANSACTION_ADAPTER_EXT : TemplateConfig = new TemplateConfig("productline.LineTransactionAdapterExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var LINE_VALIDATION : TemplateConfig = new TemplateConfig("productline.LineValidation", GOSU, BASE, DISCLAIMER)
  public static final var LINE_VALIDATION_EXT : TemplateConfig = new TemplateConfig("productline.LineValidationExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var LINE_QUOTE_DISPLAY_UTIL : TemplateConfig = new TemplateConfig("productline.LineQuoteDisplayUtil", GOSU, BASE, DISCLAIMER)
  public static final var LINE_QUOTE_DISPLAY_UTIL_EXT : TemplateConfig = new TemplateConfig("productline.LineQuoteDisplayUtilExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var POLICY_LINE_METHODS : TemplateConfig = new TemplateConfig("productline.PolicyLineMethods", GOSU, BASE, DISCLAIMER)
  public static final var POLICY_LINE_METHODS_EXT : TemplateConfig = new TemplateConfig("productline.PolicyLineMethodsExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var RATING_ENGINE : TemplateConfig = new TemplateConfig("productline.RatingEngine", GOSU, BASE, DISCLAIMER)
  public static final var RATING_ENGINE_EXT : TemplateConfig = new TemplateConfig("productline.RatingEngineExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var RATE_ROUTINE_CONFIG : TemplateConfig = new TemplateConfig("productline.RateRoutineConfig", GOSU, BASE, DISCLAIMER)
  public static final var RATE_ROUTINE_CONFIG_EXT : TemplateConfig = new TemplateConfig("productline.RateRoutineConfigExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SCH_CONDITION_IMPL : TemplateConfig = new TemplateConfig("coverable.ScheduleCondImpl", GOSU, BASE, DISCLAIMER)
  public static final var SCH_CONDITION_IMPL_EXT : TemplateConfig = new TemplateConfig("coverable.ScheduleCondImplExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SCH_COVERAGE_IMPL : TemplateConfig = new TemplateConfig("coverable.ScheduleCovImpl", GOSU, BASE, DISCLAIMER)
  public static final var SCH_COVERAGE_IMPL_EXT : TemplateConfig = new TemplateConfig("coverable.ScheduleCovImplExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SCH_COND_ITEM_COVERABLE_ADAPTER : TemplateConfig = new TemplateConfig("coverable.ScheduleCondItemCoverableAdapter", GOSU, BASE, DISCLAIMER)
  public static final var SCH_COND_ITEM_COVERABLE_ADAPTER_EXT : TemplateConfig = new TemplateConfig("coverable.ScheduleCondItemCoverableAdapterExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SCH_COND_ITEM_MATCHER : TemplateConfig = new TemplateConfig("coverable.ScheduleCondItemMatcher", GOSU, BASE, DISCLAIMER)
  public static final var SCH_COND_ITEM_MATCHER_EXT : TemplateConfig = new TemplateConfig("coverable.ScheduleCondItemMatcherExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SCH_COND_ITEM_COND_CONDITION_ADAPTER : TemplateConfig = new TemplateConfig("coverable.ScheduleCondItemCondConditionAdapter", GOSU, BASE, DISCLAIMER)
  public static final var SCH_COND_ITEM_COND_CONDITION_ADAPTER_EXT : TemplateConfig = new TemplateConfig("coverable.ScheduleCondItemCondConditionAdapterExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SCH_COND_ITEM_COND_MATCHER : TemplateConfig = new TemplateConfig("coverable.CoverableScheduleCondItemCondMatcher", GOSU, BASE, DISCLAIMER)
  public static final var SCH_COND_ITEM_COND_MATCHER_EXT : TemplateConfig = new TemplateConfig("coverable.CoverableScheduleCondItemCondMatcherExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SCH_COV_ITEM_COVERABLE_ADAPTER : TemplateConfig = new TemplateConfig("coverable.ScheduleCovItemCoverableAdapter", GOSU, BASE, DISCLAIMER)
  public static final var SCH_COV_ITEM_COVERABLE_ADAPTER_EXT : TemplateConfig = new TemplateConfig("coverable.ScheduleCovItemCoverableAdapterExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SCH_COV_ITEM_MATCHER : TemplateConfig = new TemplateConfig("coverable.ScheduleCovItemMatcher", GOSU, BASE, DISCLAIMER)
  public static final var SCH_COV_ITEM_MATCHER_EXT : TemplateConfig = new TemplateConfig("coverable.ScheduleCovItemMatcherExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SCH_COV_ITEM_COV_COVERAGE_ADAPTER : TemplateConfig = new TemplateConfig("coverable.ScheduleCovItemCovCoverageAdapter", GOSU, BASE, DISCLAIMER)
  public static final var SCH_COV_ITEM_COV_COVERAGE_ADAPTER_EXT : TemplateConfig = new TemplateConfig("coverable.ScheduleCovItemCovCoverageAdapterExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SCH_COV_ITEM_COV_MATCHER : TemplateConfig = new TemplateConfig("coverable.CoverableScheduleCovItemCovMatcher", GOSU, BASE, DISCLAIMER)
  public static final var SCH_COV_ITEM_COV_MATCHER_EXT : TemplateConfig = new TemplateConfig("coverable.CoverableScheduleCovItemCovMatcherExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SCH_EXCLUSION_IMPL : TemplateConfig = new TemplateConfig("coverable.ScheduleExclImpl", GOSU, BASE, DISCLAIMER)
  public static final var SCH_EXCLUSION_IMPL_EXT : TemplateConfig = new TemplateConfig("coverable.ScheduleExclImplExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SCH_EXCL_ITEM_COVERABLE_ADAPTER : TemplateConfig = new TemplateConfig("coverable.ScheduleExclItemCoverableAdapter", GOSU, BASE, DISCLAIMER)
  public static final var SCH_EXCL_ITEM_COVERABLE_ADAPTER_EXT : TemplateConfig = new TemplateConfig("coverable.ScheduleExclItemCoverableAdapterExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SCH_EXCL_ITEM_MATCHER : TemplateConfig = new TemplateConfig("coverable.ScheduleExclItemMatcher", GOSU, BASE, DISCLAIMER)
  public static final var SCH_EXCL_ITEM_MATCHER_EXT : TemplateConfig = new TemplateConfig("coverable.ScheduleExclItemMatcherExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SCH_EXCL_ITEM_EXCL_EXCLUSION_ADAPTER : TemplateConfig = new TemplateConfig("coverable.ScheduleExclItemExclExclusionAdapter", GOSU, BASE, DISCLAIMER)
  public static final var SCH_EXCL_ITEM_EXCL_EXCLUSION_ADAPTER_EXT : TemplateConfig = new TemplateConfig("coverable.ScheduleExclItemExclExclusionAdapterExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SCH_EXCL_ITEM_EXCL_MATCHER : TemplateConfig = new TemplateConfig("coverable.CoverableScheduleExclItemExclMatcher", GOSU, BASE, DISCLAIMER)
  public static final var SCH_EXCL_ITEM_EXCL_MATCHER_EXT : TemplateConfig = new TemplateConfig("coverable.CoverableScheduleExclItemExclMatcherExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SPLIT_COVERABLE : TemplateConfig = new TemplateConfig("coverable.SplitCoverableImpl", GOSU, BASE, DISCLAIMER)
  public static final var SPLIT_COVERABLE_EXT : TemplateConfig = new TemplateConfig("coverable.SplitCoverableImplExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SPLIT_EXPOSURE : TemplateConfig = new TemplateConfig("coverable.SplitExposureImpl", GOSU, BASE, DISCLAIMER)
  public static final var SPLIT_EXPOSURE_EXT : TemplateConfig = new TemplateConfig("coverable.SplitExposureImplExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var SYNCABLE_ADAPTER : TemplateConfig = new TemplateConfig("coverable.SyncableAdapter", GOSU, BASE, DISCLAIMER)
  public static final var SYNCABLE_ADAPTER_EXT : TemplateConfig = new TemplateConfig("coverable.SyncableAdapterExt", GOSU, EXTENSION, NO_DISCLAIMER)

  public static final var EXPOSURE_SYNCABLE_ADAPTER : TemplateConfig = new TemplateConfig("coverable.ExposureSyncableAdapter", GOSU, BASE, DISCLAIMER)
  public static final var EXPOSURE_SYNCABLE_ADAPTER_EXT : TemplateConfig = new TemplateConfig("coverable.ExposureSyncableAdapterExt", GOSU, EXTENSION, NO_DISCLAIMER)
}