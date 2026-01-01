package nz.co.acc.edge.capabilities.policy.lob.wps

uses edge.capabilities.policy.dto.CoverageDTO
uses edge.capabilities.policy.lob.ILobPolicyPlugin
uses edge.capabilities.policy.lob.util.PolicyLineUtil
uses edge.di.annotations.InjectableNode
uses nz.co.acc.edge.capabilities.policy.lob.util.PolicyLineUtil_ACC
uses nz.co.acc.edge.capabilities.policy.lob.wps.dto.WPSPolicyExtensionDTO_ACC

/**
 * Created by nitesh.gautam on 27-Apr-17.
 */
class WPSPolicyPlugin_ACC implements ILobPolicyPlugin<WPSPolicyExtensionDTO_ACC> {
  @InjectableNode
  construct() {
  }

  override function getPolicyLineInfo(period: PolicyPeriod): WPSPolicyExtensionDTO_ACC {
    final var res = new WPSPolicyExtensionDTO_ACC()
    if (period.CWPSLineExists) {
      final var line = period.CWPSLine
      PolicyLineUtil.fillBaseProperties(res, line)
      var chargePatterns = new LinkedList<ChargePattern>()
      chargePatterns.add(ChargePattern.TC_WAL)
      PolicyLineUtil_ACC.fillExtendedBaseProperties(res, line, chargePatterns)

      res.CoverageDTOs = convertToCoveragesDTO(line.CWPSCovs, line.getDisplayName())

      res.BICCodes = line.getBICCodes().map(\bicCode -> PolicyLineUtil_ACC.createBICCode(bicCode))
      res.ACCPolicySuffix = period.ACCPolicyID_ACC.substring(period.ACCPolicyID_ACC.length - 1)
      res.IsAEPMember = period.IsAEPMemberPolicy_ACC
    }
    return res
  }

  public static function convertToCoveragesDTO(coverages: CWPSCov[], lineName: String): CoverageDTO[] {
    return coverages.map(\cov -> PolicyLineUtil_ACC.createBaseCoverage(lineName))
  }
}