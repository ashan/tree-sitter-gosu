package nz.co.acc.lob.emp.rating

uses entity.windowed.EMPWPCLineVersionList
uses entity.windowed.EMPWPCModifierCostVersionList
uses gw.api.effdate.EffDatedUtil
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.Key
uses gw.pl.persistence.core.effdate.EffDatedVersionList

uses typekey.Currency

class EMPModifierCostData extends EMPCostData<EMPWPCModifierCost> {

  var _coveredItemID: Key
  var _modifierID: Key
  var _modifierDateID: Key

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, coveredItemID: Key, modifier : Key, modifierDate: Key) {
    super(effDate, expDate, c, rateCache)
    assertKeyType(coveredItemID, entity.EMPWPCLine)
    assertKeyType(modifier, EMPWPCLineMod)
    if (modifierDate != null) assertKeyType(modifierDate, EffectiveExpirationDate_ACC)
    init(coveredItemID, modifier, modifierDate)
  }

  construct(effDate: Date, expDate: Date, coveredItemID: Key, modifier : Key, modifierDate: Key) {
    super(effDate, expDate)
    assertKeyType(coveredItemID, entity.EMPWPCLine)
    assertKeyType(modifier, EMPWPCLineMod)
    if (modifierDate != null) assertKeyType(modifierDate, EffectiveExpirationDate_ACC)
    init(coveredItemID, modifier, modifierDate)
  }

  construct(effDate: Date, expDate: Date, coveredItemID: Key, modifier : Key) {
    super(effDate, expDate)
    assertKeyType(coveredItemID, entity.EMPWPCLine)
    assertKeyType(modifier, EMPWPCLineMod)
    init(coveredItemID, modifier, null)
  }

  private function init(coveredItemID: Key, modifier : Key, modifierDate: Key) {
    _coveredItemID = coveredItemID
    _modifierID = modifier
    _modifierDateID = modifierDate
  }

  construct(cost: EMPWPCModifierCost) {
    super(cost)
    _coveredItemID = cost.EMPWPCLine.FixedId
    _modifierID = cost.Modifier.FixedId
    _modifierDateID = cost.ModifierEffExpDate.FixedId
  }

  construct(cost: EMPWPCModifierCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _coveredItemID = cost.EMPWPCLine.FixedId
    _modifierID = cost.Modifier.FixedId
    _modifierDateID = cost.ModifierEffExpDate.FixedId
  }

  override function setSpecificFieldsOnCost(line: EMPWPCLine, costEntity: EMPWPCModifierCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("EMPWPCLine", _coveredItemID)
    costEntity.setFieldValue("Modifier", _modifierID)
    costEntity.setFieldValue("ModifierEffExpDate", _modifierDateID)
  }

  override function getVersionedCosts(line: productmodel.EMPWPCLine): List<EffDatedVersionList> {
    var coveredItemVL = EffDatedUtil.createVersionList(line.Branch, _coveredItemID) as EMPWPCLineVersionList
    return coveredItemVL.EMPWPCModifierCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: EMPWPCModifierCostVersionList): boolean {
    var versionList = costVL.AllVersions.first()
    var isCost = versionList typeis EMPWPCModifierCost and
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