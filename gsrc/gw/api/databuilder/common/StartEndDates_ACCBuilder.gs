package gw.api.databuilder.common

/**
 * Builds an Employer WPC Policy Line Modifier.
 */
@Export
class StartEndDates_ACCBuilder {//extends ModifierBuilder<EffectiveExpirationDate_ACC, EffectiveExpirationDate_ACCBuilder> {

  protected var _startEndDate : StartEndDates_ACC
  var _effectiveExpiration : EffectiveExpirationDate_ACC
  construct(policyPeriod:PolicyPeriod) {
    _startEndDate = new StartEndDates_ACC(policyPeriod)
  }

  function withEffectiveExpirationDate(date : EffectiveExpirationDate_ACCBuilder) : StartEndDates_ACCBuilder {
    _effectiveExpiration =_startEndDate.createAndAddEffectiveExpirationDate()
    _effectiveExpiration.seteffectiveDate_ACC(date.getEffectiveDate())
    _effectiveExpiration.setexpirationDate_ACC(date.getExpirationDate())
    return this
  }

  function getStartEndDate() : StartEndDates_ACC{
    return this._startEndDate
  }
}