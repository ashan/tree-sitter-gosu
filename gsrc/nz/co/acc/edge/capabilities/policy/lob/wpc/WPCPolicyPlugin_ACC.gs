package nz.co.acc.edge.capabilities.policy.lob.wpc

uses edge.capabilities.policy.dto.CoverageDTO
uses edge.capabilities.policy.lob.ILobPolicyPlugin
uses edge.capabilities.policy.lob.util.PolicyLineUtil
uses edge.di.annotations.InjectableNode
uses nz.co.acc.edge.capabilities.policy.lob.util.PolicyLineUtil_ACC
uses nz.co.acc.edge.capabilities.policy.lob.wpc.dto.WPCPolicyExtensionDTO_ACC

/**
 * Created by nitesh.gautam on 27-Mar-17.
 */
class WPCPolicyPlugin_ACC implements ILobPolicyPlugin<WPCPolicyExtensionDTO_ACC> {

  @InjectableNode
  construct() {
  }

  override function getPolicyLineInfo(period: PolicyPeriod): WPCPolicyExtensionDTO_ACC {
    final var res = new WPCPolicyExtensionDTO_ACC()
    if (period.EMPWPCLineExists) {
      final var line = period.EMPWPCLine
      PolicyLineUtil.fillBaseProperties(res, line)
      var chargePatterns = new LinkedList<ChargePattern>()
      chargePatterns.add(ChargePattern.TC_WAL)
      PolicyLineUtil_ACC.fillExtendedBaseProperties(res, line, chargePatterns)

      res.CoverageDTOs = convertToCoveragesDTO(line.EMPWPCCovs, line.getDisplayName())

      res.BICCodes = line.getBICCodes().map(\bicCode -> PolicyLineUtil_ACC.createBICCode(bicCode))
      res.ACCPolicySuffix = period.ACCPolicyID_ACC.substring(period.ACCPolicyID_ACC.length-1)
      res.IsAEPMember = period.IsAEPMemberPolicy_ACC
      if(period.EMPWPCLineExists) {
        var le = period.EMPWPCLine.EMPWPCCovs.first().LiableEarningCov
        res.ERAIndicator = le?.ERAIndicator_ACC
        res.ERAContractNumber = le?.ERAContractNumber_ACC
        res.ERAChangedDate = le?.ERAChangedDate_ACC
        res.EmployerEarnings.TotalEarningsNotLiable = le.TotalEarningsNotLiable_amt
        res.EmployerEarnings.TotalExcessPaid = le.TotalExcessPaid_amt
        res.EmployerEarnings.TotalGrossEarnings = le.TotalGrossEarnings_amt
        res.EmployerEarnings.PaymentToEmployees = le.PaymentToEmployees_amt
        res.EmployerEarnings.TotalPAYE = le.TotalPAYE_amt
      }
    }
    return res
  }

  public static function convertToCoveragesDTO(coverages: EMPWPCCov[], lineName: String): CoverageDTO[] {
    return coverages.map(\cov -> PolicyLineUtil_ACC.createBaseCoverage(lineName))
  }
}