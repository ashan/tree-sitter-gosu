package nz.co.acc.lob.ind.rating

uses entity.windowed.INDCoPLineVersionList
uses entity.windowed.INDCoPModifierCostVersionList
uses gw.api.effdate.EffDatedUtil
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.Key
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses typekey.Currency

class INDCoPModifierCostData extends INDCostData<INDCoPModifierCost> {

  var _coveredItemID: Key
  var _modifierID: Key
  var _modifierDateID: Key

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, coveredItemID: Key, modifier : Key, modifierDate: Key) {
    super(effDate, expDate, c, rateCache)
    assertKeyType(coveredItemID, entity.INDCoPLine)
    if (modifierDate != null) assertKeyType(modifierDate, EffectiveExpirationDate_ACC)
    init(coveredItemID, modifier, modifierDate)
  }

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, coveredItemID: Key, modifier : Key) {
    super(effDate, expDate, c, rateCache)
    assertKeyType(coveredItemID, entity.INDCoPLine)
    init(coveredItemID, modifier)
  }

  construct(effDate: Date, expDate: Date, coveredItemID: Key, modifier : Key, modifierDate: Key) {
    super(effDate, expDate)
    assertKeyType(coveredItemID, INDCoPLine)
    assertKeyType(modifier, ProductModifier)
    init(coveredItemID, modifier, modifierDate)
  }

  private function init(coveredItemID: Key, modifier : Key) {
    _coveredItemID = coveredItemID
    _modifierID = modifier
  }

  private function init(coveredItemID: Key, modifier : Key, modifierDate: Key) {
    _coveredItemID = coveredItemID
    _modifierID = modifier
    _modifierDateID = modifierDate
  }

  construct(cost: INDCoPModifierCost) {
    super(cost)
    _coveredItemID = cost.INDCoPLine.FixedId
    _modifierID = cost.Modifier.FixedId
    _modifierDateID = cost.ModifierEffExpDate.FixedId
  }

  construct(cost: INDCoPModifierCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _coveredItemID = cost.INDCoPLine.FixedId
    _modifierID = cost.Modifier.FixedId
    _modifierDateID = cost.ModifierEffExpDate.FixedId
  }

  override function setSpecificFieldsOnCost(line: INDCoPLine, costEntity: INDCoPModifierCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("INDCoPLine", _coveredItemID)
    costEntity.setFieldValue("Modifier", _modifierID)
    if(_modifierDateID != null) {
      costEntity.setFieldValue("ModifierEffExpDate", _modifierDateID)
    }
  }

  override function getVersionedCosts(line: INDCoPLine): List<EffDatedVersionList> {
    var coveredItemVL = EffDatedUtil.createVersionList(line.Branch, _coveredItemID) as INDCoPLineVersionList
    return coveredItemVL.INDCoPModifierCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: INDCoPModifierCostVersionList): boolean {
    var versionList = costVL.AllVersions.first()
    var isCost = versionList typeis INDCoPModifierCost and
                 versionList.Modifier.FixedId == _modifierID and
                (versionList.ModifierEffExpDate != null and _modifierDateID != null ? versionList.ModifierEffExpDate.FixedId == _modifierDateID : true)
    return isCost
  }

  override function toString(): String {
    return "Covered Item: ${_coveredItemID}, ${_modifierID}, ${_modifierDateID}"
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {_coveredItemID, _modifierID}

    if(_modifierDateID != null) {
      result.add(_modifierDateID)
    }

    result.addAll(super.KeyValues)
    return result
  }
}