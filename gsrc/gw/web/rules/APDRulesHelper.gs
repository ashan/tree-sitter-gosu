package gw.web.rules

uses entity.PolicyLine
uses gw.api.domain.rules.SyncableAdapter
uses gw.api.productedition.APDDependencyRulesHelper
uses gw.api.productedition.APDMinMaxRulesHelper
uses gw.api.productedition.APDRulesUIHelper
uses gw.api.productedition.APDTypekeyAvailabilityRulesHelper
uses gw.api.productedition.ProductEditionService
uses gw.api.productedition.PropertyProductEditionKey
uses gw.api.productmodel.ProductModelClass
uses gw.api.productmodel.TypekeyCovTermPattern
uses gw.api.web.job.JobWizardHelper
uses gw.entity.TypeKey
uses gw.lang.Deprecated
uses gw.lang.reflect.IPropertyInfo
uses gw.web.productmodel.ProductModelSyncIssueWrapper
uses gw.web.productmodel.ProductModelSyncIssuesHandler

uses java.math.BigDecimal

@Export
class APDRulesHelper {

  // ========== Visibility helper functions

  /**
   * Checks if a product model object (clause, covterm or covterm option) associated with a coverable is visible
   * according to the applicable product edition rules.
   *
   * @param coverable         a coverable that the product model object is associated with, used to find applicable
   *                          product edition
   * @param productModelClass a product model object
   * @return true, if product model object is visible
   */
  @Deprecated("PC10.1.2 Use the gw.api.productedition.APDRulesUIHelper.isVisible(Coverable, ProductModelClass) instead", "PC10.1.2")
  static function isVisible(coverable : Coverable, productModelClass : ProductModelClass) : boolean {
    return APDRulesUIHelper.isVisible(coverable, productModelClass)
  }

  /**
   * Checks if a property of an effdated entity is visible according to the applicable product edition rules.
   *
   * @param policyLine   a policy line, used to find applicable product edition
   * @param effDated     an effdated entity
   * @param propertyInfo a property info
   * @return true, if property of an effdated entity is visible
   */
  @Deprecated("PC10.1.2 Use the gw.api.productedition.APDRulesUIHelper.isVisible(PolicyLine, EffDated, IPropertyInfo) instead", "PC10.1.2")
  static function isVisible(policyLine : PolicyLine, effDated : EffDated, propertyInfo : IPropertyInfo) : boolean {
    return APDRulesUIHelper.isVisible(policyLine, effDated, propertyInfo)
  }

  // ========== Editability helper functions

  /**
   * Checks if a product model object (clause, covterm or covterm option) associated with a coverable is editable
   * according to the applicable product edition rules.
   *
   * @param coverable         a coverable that the product model object is associated with, used to find applicable
   *                          product edition
   * @param productModelClass a product model object
   * @return true, if product model object is editable
   */
  @Deprecated("PC10.1.2 Use the gw.api.productedition.APDRulesUIHelper.isEditable(Coverable, ProductModelClass) instead", "PC10.1.2")
  static function isEditable(coverable : Coverable, productModelClass : ProductModelClass) : boolean {
    return APDRulesUIHelper.isEditable(coverable, productModelClass)
  }

  /**
   * Checks if a property of an effdated entity is editable according to the applicable product edition rules.
   *
   * @param policyLine   a policy line, used to find applicable product edition
   * @param effDated     an effdated entity
   * @param propertyInfo a property info
   * @return true, if property of an effdated entity is editable
   */
  @Deprecated("PC10.1.2 Use the gw.api.productedition.APDRulesUIHelper.isEditable(PolicyLine, EffDated, IPropertyInfo) instead", "PC10.1.2")
  static function isEditable(policyLine : PolicyLine, effDated : EffDated, propertyInfo : IPropertyInfo) : boolean {
    return APDRulesUIHelper.isEditable(policyLine, effDated, propertyInfo)
  }

  // ========== Availability helper functions

  /**
   * Checks if a property of an effdated entity is available according to the applicable product edition rules.
   *
   * @param policyLine   a policy line, used to find applicable product edition
   * @param effDated     an effdated entity
   * @param propertyInfo a property info
   * @return true, if property of an effdated entity is available
   */
  @Deprecated("PC10.1.2 No longer used", "PC10.1.2")
  static function isAvailable(policyLine : PolicyLine, effDated : EffDated, propertyInfo : IPropertyInfo) : boolean {
    var productEditionKey = new PropertyProductEditionKey(effDated, propertyInfo)
    var ruleResult = ProductEditionService.Instance.evaluateAvailabilityRules(policyLine, effDated, productEditionKey)
    return ruleResult.Result != AvailabilityType.TC_UNAVAILABLE
  }

  // ========== Dependency helper functions

  /**
   * Checks if a product model object (clause, covterm or covterm option) associated with a coverable has any other
   * object (other product model object or entity property) that references this object in its rules in the applicable
   * product edition.
   *
   * @param coverable         a coverable associated with a product model object
   * @param productModelClass a product model object
   * @return true, if there are any objects in the product edition that depend on the product model object
   */
  @Deprecated("PC10.1.2 Use the gw.api.productedition.APDDependencyRulesHelper.hasDependents(Coverable, ProductModelClass) instead", "PC10.1.2")
  static function hasDependents(coverable : Coverable, productModelClass : ProductModelClass) : boolean {
    return APDDependencyRulesHelper.hasDependents(coverable, productModelClass)
  }

  /**
   * Checks if a property of an effdated entity has any other object (product model object or entity property) that
   * references this property in its rules in the applicable product edition.
   *
   * @param policyLine   a policy line, used to find applicable product edition
   * @param effDated     an effdated entity
   * @param propertyInfo a property info
   * @return true, if there are any objects in the product edition that depend on the property of the effdated entity
   */
  @Deprecated("PC10.1.2 Use the gw.api.productedition.APDDependencyRulesHelper.hasDependents(PolicyLine, EffDated, IPropertyInfo) instead", "PC10.1.2")
  static function hasDependents(policyLine : PolicyLine, effDated : EffDated, propertyInfo : IPropertyInfo) : boolean {
    return APDDependencyRulesHelper.hasDependents(policyLine, effDated, propertyInfo)
  }

  // ========== onChange helper functions

  /**
   * A handler to be called when there is a change that causes an update of the effdated entity. Synchronizes all
   * properties of the entity. If the entity is also a Coverable, synchronizes product model objects that are
   * associated with it.
   * <p>
   * Any issue that occur during synchronization and can not be automatically fixed is added to the job wizard helper,
   * if it is not null.
   *
   * @param effDated        an effdated entity to be synchronized
   * @param jobWizardHelper job wizard helper
   */
  static function onChange(effDated : EffDated, jobWizardHelper : JobWizardHelper) {
    onChange({effDated}, jobWizardHelper)
  }

  /**
   * A handler to be called when there is a change that causes an update of a list of effdated entities. Synchronizes
   * all properties of each entity in the list. If any entity is also a Coverable, synchronizes product model objects
   * that are associated with it.
   * <p>
   * Any issue that occur during synchronization and can not be automatically fixed is added to the job wizard helper,
   * if it is not null.
   *
   * @param effDatedList    a list of effdated entities to be synchronized
   * @param jobWizardHelper job wizard helper
   */
  static function onChange(effDatedList : EffDated[], jobWizardHelper : JobWizardHelper) {
    effDatedList?.each(\effDated -> {
      if (effDated typeis SyncableAdapter) {
        var issues = effDated.syncFieldsAndFixIssues()
        if (issues.HasElements and jobWizardHelper != null) {
          ProductModelSyncIssuesHandler.filterAndDisplayIssuesAfterSync(issues, jobWizardHelper)
        }
      }
      if (effDated typeis Coverable) {
        syncCoverable(effDated, jobWizardHelper)
      }
    })
  }

  /**
   * A handler to be called when there is a change that causes an update of a list of effdated entities. Synchronizes
   * only a specified sub-set of properties of each entity in the list. If any entity is also a Coverable, synchronizes
   * product model objects that are associated with it.
   * <p>
   * Any issue that occur during synchronization and can not be automatically fixed is added to the job wizard helper,
   * if it is not null.
   *
   * @param effDatedList    a list of effdated entities
   * @param fields          a list of properties to be synchronized
   * @param jobWizardHelper job wizard helper
   */
  static function onChange(effDatedList : EffDated[], fields : List<IPropertyInfo>, jobWizardHelper : JobWizardHelper) {
    effDatedList?.each(\effDated -> {
      if (effDated typeis SyncableAdapter) {
        var issues = effDated.syncFieldsAndFixIssues(fields)
        if (issues.HasElements and jobWizardHelper != null) {
          ProductModelSyncIssuesHandler.filterAndDisplayIssuesAfterSync(issues, jobWizardHelper)
        }
      }
      if (effDated typeis Coverable) {
        syncCoverable(effDated, jobWizardHelper)
      }
    })
  }

  // ========== onEnter helper functions

  /**
   * A handler to be called when entering a PCF page that displays an effdated entity. Synchronize all properties of
   * the entity. If an entity is also a Coverable, synchronizes product model objects that are associated with it.
   * <p>
   * Any issue that occur during synchronization and can not be automatically fixed is added to the job wizard helper,
   * if it is not null.
   *
   * @param effDated        an effdated entity to be synchronized
   * @param jobWizardHelper job wizard helper
   */
  static function onEnter(effDated : EffDated, jobWizardHelper : JobWizardHelper) {
    onEnter({effDated}, jobWizardHelper)
    if (effDated typeis Coverable) {
      syncCoverable(effDated, jobWizardHelper)
    }
  }

  /**
   * A handler to be called when entering a PCF page that displays a list of effdated entities. Synchronize all\
   * properties of each entity in the list.
   * <p>
   * Any issue that occur during synchronization and can not be automatically fixed is added to the job wizard helper,
   * if it is not null.
   *
   * @param effDatedList    a list of effdated entities
   * @param jobWizardHelper job wizard helper
   */
  static function onEnter(effDatedList : EffDated[], jobWizardHelper : JobWizardHelper) {
    effDatedList?.each(\effDated -> {
      if (effDated typeis SyncableAdapter) {
        var issues = effDated.syncFieldsAndFixIssues()
        if (issues.HasElements and jobWizardHelper != null) {
          ProductModelSyncIssuesHandler.filterAndDisplayIssuesAfterSync(issues, jobWizardHelper)
        }
      }
    })
  }

  /**
   * A handler to be called when entering a PCF page that displays a list of effdated entities. Synchronize only a
   * specified sub-set of properties of each entity in the list.
   * <p>
   * Any issue that occur during synchronization and can not be automatically fixed is added to the job wizard helper,
   * if it is not null.
   *
   * @param effDatedList    a list of effdated entities
   * @param fields          a list of properties to be synchronized
   * @param jobWizardHelper job wizard helper
   */
  static function onEnter(effDatedList : EffDated[], fields : List<IPropertyInfo>, jobWizardHelper : JobWizardHelper) {
    effDatedList?.each(\effDated -> {
      if (effDated typeis SyncableAdapter) {
        var issues = effDated.syncFieldsAndFixIssues(fields)
        if (issues.HasElements and jobWizardHelper != null) {
          ProductModelSyncIssuesHandler.filterAndDisplayIssuesAfterSync(issues, jobWizardHelper)
        }
      }
    })
  }

  // ========== Validate Value in Range helper functions

  /**
   * Validates if a date value is inside of a min-max range defined by the rules in the applicable product edition.
   * A combination of policy line, effdated entity type and property info is used to find the correct product edition.
   *
   * @param policyLine   a policy line
   * @param effDated     an effdated entity whose property value is validated
   * @param propertyInfo a property info of the property to be validated
   * @param value        a date value to be validated
   * @return an error message, if the value is outside of the min-max range; null, if the value is valid
   */
  @Deprecated("PC10.1.2 Use the gw.api.productedition.APDMinMaxRulesHelper.validateDateValueInRange(PolicyLine, EffDated, IPropertyInfo, Date) instead", "PC10.1.2")
  static function validateDateValueInRange(policyLine : PolicyLine, effDated : EffDated, propertyInfo : IPropertyInfo, value : Date) : String {
    return APDMinMaxRulesHelper.validateDateValueInRange(policyLine, effDated, propertyInfo, value)
  }

  /**
   * Validates if a decimal value is inside of a min-max range defined by the rules in the applicable product edition.
   * A combination of policy line, effdated entity type and property info is used to find the correct product edition.
   *
   * @param policyLine   a policy line
   * @param effDated     an effdated entity whose property value is validated
   * @param propertyInfo a property info of the property to be validated
   * @param value        a decimal value to be validated
   * @return an error message, if the value is outside of the min-max range; null, if the value is valid
   */
  @Deprecated("PC10.1.2 se the gw.api.productedition.APDMinMaxRulesHelper.validateDecimalValueInRange(PolicyLine, EffDated, IPropertyInfo, BigDecimal) instead", "PC10.1.2")
  static function validateDecimalValueInRange(policyLine : PolicyLine, effDated : EffDated, propertyInfo : IPropertyInfo, value : BigDecimal) : String {
    return APDMinMaxRulesHelper.validateDecimalValueInRange(policyLine, effDated, propertyInfo, value)
  }

  /**
   * Validates if a money (decimal) value is inside of a min-max range defined by the rules in the applicable product
   * edition. A combination of policy line, effdated entity type and property info is used to find the correct product
   * edition.
   *
   * @param policyLine   a policy line
   * @param effDated     an effdated entity whose property value is validated
   * @param propertyInfo a property info of the property to be validated
   * @param value        a money (decimal) value to be validated
   * @return an error message, if the value is outside of the min-max range; null, if the value is valid
   */
  @Deprecated("PC10.1.2 Use the gw.api.productedition.APDMinMaxRulesHelper.validateMoneyValueInRange(PolicyLine, EffDated, IPropertyInfo, BigDecimal) instead", "PC10.1.2")
  static function validateMoneyValueInRange(policyLine : PolicyLine, effDated : EffDated, propertyInfo : IPropertyInfo, value : BigDecimal) : String {
    return APDMinMaxRulesHelper.validateMoneyValueInRange(policyLine, effDated, propertyInfo, value)
  }

  /**
   * Validates if an integer value is inside of a min-max range defined by the rules in the applicable product edition.
   * A combination of policy line, effdated entity type and property info is used to find the correct product edition.
   *
   * @param policyLine   a policy line
   * @param effDated     an effdated entity whose property value is validated
   * @param propertyInfo a property info of the property to be validated
   * @param value        an integer value to be validated
   * @return an error message, if the value is outside of the min-max range; null, if the value is valid
   */
  @Deprecated("PC10.1.2 Use the gw.api.productedition.APDMinMaxRulesHelper.validateIntegerValueInRange(PolicyLine, EffDated, IPropertyInfo, Integer) instead", "PC10.1.2")
  static function validateIntegerValueInRange(policyLine : PolicyLine, effDated : EffDated, propertyInfo : IPropertyInfo, value : Integer) : String {
    return APDMinMaxRulesHelper.validateIntegerValueInRange(policyLine, effDated, propertyInfo, value)
  }

  // ========== Typekey helper functions

  /**
   * Filters out typekey values of a typekey covterm that are unavailable according to the rules defined in the
   * applicable product edition.
   *
   * @param coverable             a coverable that the typekey covterm is associated with
   * @param typekeyCovTermPattern a typekey covterm pattern
   * @param values                a full list of typekey values to be filtered
   * @param <T>                   a specific typekey type
   * @return a list of typekey values filtered according to the product edition rules
   */
  @Deprecated("PC10.1.2 Use the gw.api.productedition.APDTypekeyAvailabilityRulesHelper.filterTypeKeys(Coverable, TypekeyCovTermPattern, T[]) instead", "PC10.1.2")
  reified static function filterTypeKeys<T extends TypeKey>(coverable : Coverable, typekeyCovTermPattern : TypekeyCovTermPattern, values : T[]) : List<T> {
    return APDTypekeyAvailabilityRulesHelper.filterTypeKeys(coverable, typekeyCovTermPattern, values)
  }

  /**
   * Filters out typekey values of a typekey property on an effdated entity that are unavailable according to the rules
   * defined in the applicable product edition.
   *
   * @param policyLine   a policy line
   * @param effDated     an effdated entity whose typekey property values are filtered
   * @param propertyInfo a property info of the typekey property whose values are filtered
   * @param values       a full list of typekey values to be filtered
   * @param <T>          a specific typekey type
   * @return a list of typekey values filtered according to the product edition rules
   */
  @Deprecated("PC10.1.2 Use the gw.api.productedition.APDTypekeyAvailabilityRulesHelper.filterTypeKeys(PolicyLine, EffDated, IPropertyInfo, T[]) instead", "PC10.1.2")
  reified static function filterTypeKeys<T extends TypeKey>(policyLine : PolicyLine, effDated : EffDated, propertyInfo : IPropertyInfo, values : T[]) : List<T> {
    return APDTypekeyAvailabilityRulesHelper.filterTypeKeys(policyLine, effDated, propertyInfo, values)
  }

  // ========== private functions

  private static function syncCoverable(coverable : Coverable, jobWizardHelper : JobWizardHelper = null) {
    var issues : List<ProductModelSyncIssueWrapper> = {}

    issues.addAll(coverable.syncCoverages())
    issues.addAll(coverable.syncExclusions())
    issues.addAll(coverable.syncConditions())

    if (issues.HasElements and jobWizardHelper != null) {
      ProductModelSyncIssuesHandler.filterAndDisplayIssuesAfterSync(issues, jobWizardHelper)
    }
  }
}