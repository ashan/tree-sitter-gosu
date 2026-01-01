package nz.co.acc.lob.cpx.rating

uses entity.windowed.CPXModifierCostVersionList
uses entity.windowed.INDCPXLineVersionList
uses gw.api.effdate.EffDatedUtil
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.Key
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses typekey.Currency
uses entity.ProductModifier
uses productmodel.INDCPXLine

class CPXModifierCostData extends CPXCostData<CPXModifierCost> {

  var _coveredItemID: Key
  var _cpxEarningItemID: Key
  var _modifierID: Key
  var _modifierDateID: Key

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, coveredItemID: Key, cpxEarningID:Key, modifier : Key) {
    super(effDate, expDate, c, rateCache)
    assertKeyType(coveredItemID, entity.INDCPXLine)
    assertKeyType(cpxEarningID, CPXInfoCov_ACC)
    assertKeyType(modifier, ProductModifier)
    init(coveredItemID, cpxEarningID, modifier)
  }

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, coveredItemID: Key, cpxEarningID:Key, modifier : Key, modifierDate: Key) {
    super(effDate, expDate, c, rateCache)
    assertKeyType(coveredItemID, entity.INDCPXLine)
    assertKeyType(cpxEarningID, CPXInfoCov_ACC)
    assertKeyType(modifier, ProductModifier)
    if (modifierDate != null) {
      assertKeyType(modifierDate, EffectiveExpirationDate_ACC)
    }
    init(coveredItemID, cpxEarningID, modifier, modifierDate)
  }

  construct(effDate: Date, expDate: Date, coveredItemID: Key, cpxEarningID:Key, modifier : Key, modifierDate: Key) {
    super(effDate, expDate)
    assertKeyType(coveredItemID, INDCPXLine)
    assertKeyType(modifier, ProductModifier)
    assertKeyType(cpxEarningID, CPXInfoCov_ACC)
    if (modifierDate != null) {
      assertKeyType(modifierDate, EffectiveExpirationDate_ACC)
    }
    init(coveredItemID, cpxEarningID, modifier, modifierDate)
  }

  private function init(coveredItemID: Key, cpxEarningID:Key, modifier : Key, modifierDate: Key) {
    _coveredItemID = coveredItemID
    _cpxEarningItemID = cpxEarningID
    _modifierID = modifier
    _modifierDateID = modifierDate
  }

  private function init(coveredItemID: Key, cpxEarningID:Key, modifier : Key) {
    _coveredItemID = coveredItemID
    _cpxEarningItemID = cpxEarningID
    _modifierID = modifier
  }

  construct(cost: CPXModifierCost) {
    super(cost)
    _coveredItemID = cost.INDCPXLine.FixedId
    _modifierID = cost.Modifier.FixedId
    _cpxEarningItemID = cost.CPXInfoCov.FixedId
    _modifierDateID = cost.ModifierEffExpDate.FixedId
  }

  construct(cost: CPXModifierCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _coveredItemID = cost.INDCPXLine.FixedId
    _modifierID = cost.Modifier.FixedId
    _cpxEarningItemID = cost.CPXInfoCov.FixedId
    _modifierDateID = cost.ModifierEffExpDate.FixedId
  }

  override function setSpecificFieldsOnCost(line: INDCPXLine, costEntity: CPXModifierCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("INDCPXLine", _coveredItemID)
    costEntity.setFieldValue("CPXInfoCov", _cpxEarningItemID)
    costEntity.setFieldValue("Modifier", _modifierID)
    costEntity.setFieldValue("ModifierEffExpDate", _modifierDateID)
  }

  override function getVersionedCosts(line: INDCPXLine): List<EffDatedVersionList> {
    var coveredItemVL = EffDatedUtil.createVersionList(line.Branch, _coveredItemID) as INDCPXLineVersionList
    return coveredItemVL.CPXModifierCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: CPXModifierCostVersionList): boolean {
    var versionList = costVL.AllVersions.first()
    var isCost = versionList typeis CPXModifierCost and
                 versionList.Modifier.FixedId == _modifierID and
                 versionList.CPXInfoCov.FixedId == _cpxEarningItemID and
                 versionList.ModifierEffExpDate.FixedId == _modifierDateID
    return isCost
  }

  override function toString(): String {
    return "Covered Item: ${_coveredItemID}, ${_cpxEarningItemID}, ${_modifierID}, ${_modifierDateID}"
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {_coveredItemID, _cpxEarningItemID, _modifierID, _modifierDateID}
    result.addAll(super.KeyValues)
    return result
  }
}