package nz.co.acc.plm.integration.preupdate

uses entity.INDCPXLine
uses entity.INDCoPLine

/**
 * Created by OurednM on 26/07/2018.
 */
class PolicyPeriodPreupdateUtil {

  public static function hasBICCodesChanged(policyPeriod: PolicyPeriod, basedOn: PolicyPeriod): Boolean {

    if (policyPeriod.INDCPXLineExists) {
      // CPX policies have multiple lines so we need to compare the corresponding lines with each other
      if (!compareBICCodes(basedOn.Lines, policyPeriod.Lines)) {
        return true
      }
    } else {
      var prevBICCodes = basedOn.Lines.first().BICCodes
      var bicCodes = policyPeriod.Lines.first().BICCodes
      if (!compareBICCodes(prevBICCodes, bicCodes)) {
        return true
      }
    }

    return false
  }


  // Compare the two lists for equality on BIC Codes
  // Return false if lists are different, true if same
  private static function compareBICCodes(bicCodes1: PolicyLineBusinessClassificationUnit_ACC[],
                                          bicCodes2: PolicyLineBusinessClassificationUnit_ACC[]): boolean {
    // Get the BIC codes into lists
    var list1 = bicCodes1*.BICCode
    var list2 = bicCodes2*.BICCode

    if (list1.Count != list2.Count) {
      return false
    }

    for (l in list1) {
      if (!list2.contains(l)) {
        return false
      }
    }
    return true
  }


  // Compare the two lines for equality on BIC Codes
  private static function compareBICCodes(cpxLines: PolicyLine[], cpxLines2: PolicyLine[]): boolean {
    // There will be one CP line and one CPX line in each list of policy lines.

    // Get the CP lines
    var cpLine1 = getINDCPLine(cpxLines)
    var cpLine2 = getINDCPLine(cpxLines2)

    if (cpLine1 == null && cpLine2 != null) {
      return false
    }

    if (!compareBICCodes(cpLine1.BICCodes, cpLine2.BICCodes)) {
      return false
    }

    // Get the CPX lines
    var cpxLine1 = getINDCPXLine(cpxLines)
    var cpxLine2 = getINDCPXLine(cpxLines2)

    if (cpxLine1 == null && cpxLine2 != null)  {
      return false
    }

    return compareBICCodes(cpxLine1.BICCodes, cpxLine2.BICCodes)
  }

  private static function getINDCPXLine(lines: PolicyLine[]): entity.INDCPXLine {
    return lines.where(\elt -> elt typeis INDCPXLine).first() as INDCPXLine
  }

  private static function getINDCPLine(lines: PolicyLine[]): INDCoPLine {
    return lines.where(\elt -> elt typeis INDCoPLine).first() as INDCoPLine
  }

}