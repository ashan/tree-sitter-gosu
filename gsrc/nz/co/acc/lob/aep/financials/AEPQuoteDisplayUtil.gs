package nz.co.acc.lob.aep.financials

uses gw.api.locale.DisplayKey
uses nz.co.acc.lob.common.DateUtil_ACC

uses java.util.Map

class AEPQuoteDisplayUtil {

  var _line: entity.AEPLine_ACC
  var _costsByCbl: Map<Coverable, List<AEPCost_ACC>>
  var _cblsWithCostsByType: Map<gw.lang.reflect.IType, List<Coverable>>    // Window mode entities: Last version of each coverable and all costs
  var _trxnsByCbl: Map<Coverable, List<AEPTransaction_ACC>>
  var _cblsWithTrxnsByType: Map<gw.lang.reflect.IType, List<Coverable>>

  construct(line: entity.AEPLine_ACC, forCosts: Boolean) {
    _line = line
    if (forCosts) {
      initCosts()
    } else {
      initTransactions()
    }
  }

  private function initCosts() {
    var allCosts = _line.VersionList.AEPCosts.allVersionsFlat<AEPCost_ACC>()
    _costsByCbl = allCosts.partition<Coverable>(\cost -> cost.getSlice(cost.EffDate).OwningCoverable
        .VersionListUntyped.AllVersionsUntyped.last() as Coverable)

    _cblsWithCostsByType = _costsByCbl.Keys.toList().partition(\cbl -> (typeof cbl))
  }

  private function initTransactions() {
    var allTrxns = _line.Transactions
    // The next part is tricky because offset Transactions will point to costs in a prior version of the policy and thus to a different
    // version of the Coverable, too.  We need to get all of the Transactions that point to the same Coverable across branches (i.e. by Fixed ID)
    // and group them together linked to the latest version of that Coverable.
    var cblKeyToCblMap = allTrxns.map(\trxn -> {
      // Map from Transaction to Coverable
      var cost = trxn.Cost as AEPCost_ACC
      return cost.getSlice(cost.EffDate).OwningCoverable
    })
        .partition(\cbl -> cbl.FixedId)                         // Group all the Coverables by Fixed ID
        .mapValues(\list -> list.sort(\cbl1, cbl2 -> {
          // We want to sort the list in reverse so that the latest branch is first, and within each
          // branch, the latest version by eff date is first.  Then we'll use the first in that sorted list.
          if (cbl1.BranchUntyped.CreateTime > cbl2.BranchUntyped.CreateTime) {
            // cbl1 is from a later branch than than cbl2, so sort it first
            return true
          } else if (cbl1.BranchUntyped.CreateTime < cbl2.BranchUntyped.CreateTime) {
            // cbl1 is from an earlier branch than than cbl2, so sort it after
            return false
          } else {
            // They are from the same branch, so sort based on effective date.
            if (cbl1.EffectiveDate > cbl2.EffectiveDate) return true
            else return false
          }
        }).first()
        )
    // The result of all this is a map of FixedIDs to the version of the Coverable that should be used for all those with that Fixed ID.

    // Now map all the transactions to coverables using the FixedID --> representing Coverable map we just created
    _trxnsByCbl = allTrxns.toList().partition<Coverable>(\trxn -> {
      var cost = trxn.Cost as AEPCost_ACC
      return cblKeyToCblMap.get(cost.getSlice(cost.EffDate).OwningCoverable.FixedId)
    })
        as Map<Coverable, List<AEPTransaction_ACC>>

    _cblsWithTrxnsByType = _trxnsByCbl.Keys.toList().partition(\cbl -> (typeof cbl))
  }

  public function getCostsByCoverable(): Map<Coverable, List<AEPCost_ACC>> {
    return _costsByCbl
  }

  public function getCoverablesWithCostsByType(): Map<gw.lang.reflect.IType, List<Coverable>> {
    return _cblsWithCostsByType
  }

  public function getTrxnsByCoverable(): Map<Coverable, List<AEPTransaction_ACC>> {
    return _trxnsByCbl
  }

  public function getCoverablesWithTrxnsByType(): Map<gw.lang.reflect.IType, List<Coverable>> {
    return _cblsWithTrxnsByType
  }

  public static function CostDisplayName(cost: AEPCost_ACC): String {
    var cov = cost.Coverage

    if(cost typeis AEPWorkAccountLevyCost_ACC) {
      return cost.AEPRateableCUData.CUCode.concat("-".concat(cost.AEPRateableCUData.CUDescription))
    } else if(cost typeis AEPWorkingSaferLevyCost_ACC and DateUtil_ACC.isDatePriorACCHealthAndSafetyEndDate(cost.ExpirationDate)) {
      return DisplayKey.get("Cost.Health.and.Safety.Levy")
    }
    else if (cov != null) {
      return cov.Pattern.DisplayName
    } else {
      return cost.Subtype.DisplayName
    }
  }

  public static function CoverableDisplayName(cbl: Coverable): String {
    switch (typeof cbl) {
      default:
        return (typeof cbl).toString() + ": " + cbl.FixedId
    }
  }

  // For most policy lines, rating will only rerate from the effective date of change forward.  If so, we don't want to allow changes to
  // premium overrides that would affect dates earlier than the effective date of the policy transactions because these would not be
  // properly rerated.  If this policy line is always fully rerated (even for a mid-term change) then you can change this to return false.
  public function willRateThisSliceForward(): boolean {
    return true
  }

}