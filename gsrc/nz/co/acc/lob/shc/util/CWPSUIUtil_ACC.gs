package nz.co.acc.lob.shc.util

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException

/**
 * Created by ManubaF on 15/02/2017.
 */
class CWPSUIUtil_ACC {

  public static function generateBICCodeSetFromPolicyLine(line : PolicyLine) : Set<String> {
    var bicSet : Set<String>
    if(line.BICCodes.length > 0) {
      bicSet = line.BICCodes.map(\c -> c.BICCode).toSet()
    }
    return bicSet
  }

  public static function generateCUCodeSetFromPolicyLine(line:PolicyLine) : Set<String> {
    var cuSet : Set<String>
    if (line.BICCodes.length > 0) {
      cuSet = line.BICCodes.where(\elt -> elt.CUCode.length()>0).map(\c -> c.CUCode).toSet()
    }
    return cuSet
  }

  public static function updateCWPSShareholderClassificationUnits(businessClassification: PolicyLineBusinessClassificationUnit_ACC, policyLine : PolicyLine) {
    // Set the shareholder CU's to the new primary CU for ones that have the old primary CU
    var newCU = businessClassification.CUCode
    var oldCU = policyLine.PrimaryBICCode_ACC.CUCode
    if (newCU != oldCU) {
      // find the shareholders with the old CU and update with the new CU
      for (shareholder in (policyLine as entity.CWPSLine).PolicyShareholders) {
        for (shareholderEarnings in shareholder.ShareholderEarnings) {
          if (shareholderEarnings.CUCode == oldCU) {
            shareholderEarnings.CUCode = newCU
          }
        }
      }
    } else {
      // If a shareholder has a CU that is not in the BIC/CU list then the original CU was changed. Set these ones to the new primary CU.
      var removedCUList = new ArrayList<String>()
      var currentBICs = policyLine.BICCodes
      var currentShareholders = (policyLine as entity.CWPSLine).PolicyShareholders
      for (shareholder in currentShareholders) {
        var bicFound = currentBICs.hasMatch(\elt -> shareholder.anyShareholderEarningsMatchesCUCode(elt.CUCode))
        if (!bicFound) {
          for (shareholderEarnings in shareholder.ShareholderEarnings) {
            removedCUList.add(shareholderEarnings.CUCode)
          }
        }
      }
      // update shareholders
      for (removedCU in removedCUList) {
        for (shareholder in (policyLine as entity.CWPSLine).PolicyShareholders) {
          for (shareholderEarnings in shareholder.ShareholderEarnings) {
            if (shareholderEarnings.CUCode == removedCU) {
              shareholderEarnings.CUCode = newCU
            }
          }
        }
      }
    }
  }
}