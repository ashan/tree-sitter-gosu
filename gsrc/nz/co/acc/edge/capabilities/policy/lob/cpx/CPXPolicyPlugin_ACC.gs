package nz.co.acc.edge.capabilities.policy.lob.cpx

uses edge.capabilities.currency.dto.AmountDTO
uses edge.capabilities.policy.dto.CoverageDTO
uses edge.capabilities.policy.lob.ILobPolicyPlugin
uses edge.capabilities.policy.lob.util.PolicyLineUtil
uses edge.di.annotations.InjectableNode
uses gw.api.locale.DisplayKey
uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.edge.capabilities.policy.dto.BICCodeDTO_ACC
uses nz.co.acc.edge.capabilities.policy.dto.CoverableDTO_ACC
uses nz.co.acc.edge.capabilities.policy.lob.cpx.dto.CPXPolicyExtensionDTO_ACC
uses nz.co.acc.edge.capabilities.policy.lob.util.PolicyLineUtil_ACC
uses nz.co.acc.lob.cpx.INDCPXCovUtil_ACC

uses java.math.BigDecimal

/**
 * Created by nitesh.gautam on 30-Mar-17.
 */
class CPXPolicyPlugin_ACC implements ILobPolicyPlugin<CPXPolicyExtensionDTO_ACC> {
  @InjectableNode
  construct() {
  }

  override function getPolicyLineInfo(period: PolicyPeriod): CPXPolicyExtensionDTO_ACC {
    final var res = new CPXPolicyExtensionDTO_ACC()
    if(period.INDCPXLineExists){
      final var line = period.INDCPXLine
      PolicyLineUtil.fillBaseProperties(res, line)
      res.EmploymentStatus = line.EmploymentStatus ? DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.FullTime")
                                                   : DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.PartTime")
      res.BusinessStructure = line.BusinessStructure.DisplayName
      var chargePatterns = new LinkedList<ChargePattern>()
      chargePatterns.add(ChargePattern.TC_WAL_CPX)
      chargePatterns.add(ChargePattern.TC_EL_CPX)
      PolicyLineUtil_ACC.fillExtendedBaseProperties(res, line, chargePatterns)
      res.CoverageDTOs = convertToCoveragesDTO(line.INDCPXCovs, line.getDisplayName())
      res.CoverableDTOs = convertToCoverablesDTO(line.INDCPXCovs)
      res.BICCodes = line.getBICCodes().map(\bicCode -> PolicyLineUtil_ACC.createBICCode(bicCode))
      res.ACCPolicySuffix = period.ACCPolicyID_ACC.substring(period.Policy.Account.ACCID_ACC.length)
      var minMax = INDCPXCovUtil_ACC.findMinMaxCPXValues(period.PeriodStart)
      res.MinimumCoverPermitted = minMax.First
      res.MaximumCoverPermitted = minMax.Second
    }
    return res;
  }

  public static function convertToCoveragesDTO(coverables : INDCPXCov[], lineName : String) : CoverageDTO[] {
    return coverables.map(\cov -> PolicyLineUtil_ACC.createBaseCoverage(lineName))
  }

  public static function convertToCoverablesDTO(coverables : INDCPXCov[]) : CoverableDTO_ACC[] {
    return coverables*.CPXInfoCovs.sortBy(\elt -> elt.PeriodStart).map(\ cov -> PolicyLineUtil_ACC.createBaseCPXCoverable(cov))
  }
}