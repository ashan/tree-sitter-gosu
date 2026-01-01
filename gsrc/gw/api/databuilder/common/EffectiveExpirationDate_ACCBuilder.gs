package gw.api.databuilder.common

uses gw.api.locale.DisplayKey
uses gw.api.productmodel.ModifierPattern
uses gw.api.upgrade.PCCoercions

/**
 * Builds an Employer WPC Policy Line Modifier.
 */
@Export
class EffectiveExpirationDate_ACCBuilder {//extends ModifierBuilder<EffectiveExpirationDate_ACC, EffectiveExpirationDate_ACCBuilder> {

  protected var _effectiveExpirationDate : EffectiveExpirationDate_ACC

  construct(policyPeriod:PolicyPeriod) {
    _effectiveExpirationDate = new EffectiveExpirationDate_ACC(policyPeriod)
  }

  function withEffectiveDate(date: Date) : EffectiveExpirationDate_ACCBuilder {
    _effectiveExpirationDate.seteffectiveDate_ACC(date)
    return this
  }

  function withExpirationDate(date: Date) : EffectiveExpirationDate_ACCBuilder {
    _effectiveExpirationDate.setexpirationDate_ACC(date)
    return this
  }

  function getEffectiveDate() : Date{
    return _effectiveExpirationDate.effectiveDate_ACC
  }

  function getExpirationDate() : Date{
    return _effectiveExpirationDate.expirationDate_ACC
  }

}