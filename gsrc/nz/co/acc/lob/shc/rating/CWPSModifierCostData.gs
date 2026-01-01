package nz.co.acc.lob.shc.rating

uses entity.windowed.CWPSLineVersionList
uses entity.windowed.CWPSModifierCostVersionList
uses gw.api.effdate.EffDatedUtil
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.Key
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses typekey.Currency

class CWPSModifierCostData extends SHCCostData<CWPSModifierCost> {

  var _coveredItemID: Key
  var _modifierID: Key
  var _modifierDateID: Key

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, coveredItemID: Key, modifier : Key, modifierDate: Key) {
    super(effDate, expDate, c, rateCache)
    assertKeyType(coveredItemID, entity.CWPSLine)
    assertKeyType(modifier, CWPSLineMod)
    if (modifierDate != null) assertKeyType(modifierDate, EffectiveExpirationDate_ACC)
    init(coveredItemID, modifier, modifierDate)
  }

  construct(effDate: Date, expDate: Date, coveredItemID: Key, modifier : Key, modifierDate: Key) {
    super(effDate, expDate)
    assertKeyType(coveredItemID, entity.CWPSLine)
    assertKeyType(modifier, CWPSLineMod)
    init(coveredItemID, modifier, modifierDate)
  }

  construct(effDate: Date, expDate: Date, coveredItemID: Key, modifier : Key) {
    super(effDate, expDate)
    assertKeyType(coveredItemID, entity.CWPSLine)
    assertKeyType(modifier, CWPSLineMod)
    init(coveredItemID, modifier, null)
  }

  private function init(coveredItemID: Key, modifier : Key, modifierDate: Key) {
    _coveredItemID = coveredItemID
    _modifierID = modifier
    _modifierDateID = modifierDate
  }

  construct(cost: CWPSModifierCost) {
    super(cost)
    _coveredItemID = cost.CWPSLine.FixedId
    _modifierID = cost.Modifier.FixedId
    _modifierDateID = cost.ModifierEffExpDate.FixedId
  }

  construct(cost: CWPSModifierCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _coveredItemID = cost.CWPSLine.FixedId
    _modifierID = cost.Modifier.FixedId
    _modifierDateID = cost.ModifierEffExpDate.FixedId
  }

  override function setSpecificFieldsOnCost(line: CWPSLine, costEntity: CWPSModifierCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("CWPSLine", _coveredItemID)
    costEntity.setFieldValue("Modifier", _modifierID)
    costEntity.setFieldValue("ModifierEffExpDate", _modifierDateID)
  }

  override function getVersionedCosts(line: CWPSLine): List<EffDatedVersionList> {
    var coveredItemVL = EffDatedUtil.createVersionList(line.Branch, _coveredItemID) as CWPSLineVersionList
    return coveredItemVL.CWPSModifierCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: CWPSModifierCostVersionList): boolean {
    var versionList = costVL.AllVersions.first()
    var isCost = versionList typeis CWPSModifierCost and
                 versionList.Modifier.FixedId == _modifierID and
                (versionList.ModifierEffExpDate != null and _modifierDateID != null ? versionList.ModifierEffExpDate.FixedId == _modifierDateID : true)
    return isCost
  }

  override function toString(): String {
    return "Covered Item: ${_coveredItemID}, ${_modifierID}, ${_modifierDateID}"
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {_coveredItemID, _modifierID, _modifierDateID}
    result.addAll(super.KeyValues)
    return result
  }
}