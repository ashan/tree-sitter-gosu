package nz.co.acc.edge.capabilities.policy.lob.cp

uses edge.capabilities.policy.dto.CoverageDTO
uses edge.capabilities.policy.lob.ILobPolicyPlugin
uses edge.capabilities.policy.lob.util.PolicyLineUtil
uses edge.di.annotations.InjectableNode
uses nz.co.acc.edge.capabilities.policy.dto.CoverableDTO_ACC
uses nz.co.acc.edge.capabilities.policy.lob.cp.dto.CPPolicyExtensionDTO_ACC
uses nz.co.acc.edge.capabilities.policy.lob.cp.dto.HistoricalEarnings_ACC
uses nz.co.acc.edge.capabilities.policy.lob.util.PolicyLineUtil_ACC
uses nz.co.acc.edge.capabilities.policy.lob.cp.dto.CPLiableEarningsDTO_ACC
uses nz.co.acc.util.FeatureToogleUtil

/**
 * Created by nitesh.gautam on 27-Mar-17.
 */
class CPPolicyPlugin_ACC implements ILobPolicyPlugin<CPPolicyExtensionDTO_ACC> {

  @InjectableNode
  construct() {
  }

  override function getPolicyLineInfo(period: PolicyPeriod): CPPolicyExtensionDTO_ACC {
    final var res = new CPPolicyExtensionDTO_ACC()
    if(period.INDCoPLineExists){
      final var line = period.INDCoPLine
      PolicyLineUtil.fillBaseProperties(res, line)
      var chargePatterns = new LinkedList<ChargePattern>()
      chargePatterns.add(ChargePattern.TC_WSL)
      chargePatterns.add(ChargePattern.TC_WAL)
      chargePatterns.add(ChargePattern.TC_EL)
      chargePatterns.add(ChargePattern.TC_WARP)
      chargePatterns.add(ChargePattern.TC_ERP)
      PolicyLineUtil_ACC.fillExtendedBaseProperties(res, line, chargePatterns)
      res.CoverageDTOs = convertToCoveragesDTO(line.INDCoPCovs, line.getDisplayName())
      res.CoverableDTOs = convertToCoverablesDTO(line.INDCoPCovs)

      res.BICCodes = line.getBICCodes().map(\bicCode -> PolicyLineUtil_ACC.createBICCode(bicCode))
      res.ACCPolicySuffix = period.ACCPolicyID_ACC.substring(period.Policy.Account.ACCID_ACC.length)
      res.LiableEarnings = line.BICCodes.first().AdjustedLiableEarnings
      res.HistoricalEarnings = convertToHistoricalEarningsDTO(period)
      var cpEarnings = new CPLiableEarningsDTO_ACC()
      var earningsCov = line.INDCoPCovs.first().ActualLiableEarningsCov
      cpEarnings.NetSchedulerPayments = earningsCov.NetSchedulerPayments_amt
      cpEarnings.TotalActivePartnershipInc = earningsCov.TotalActivePartnershipInc_amt
      cpEarnings.AdjustedLTCIncome = earningsCov.AdjustedLTCIncome_amt
      cpEarnings.SelfEmployedNetIncome = earningsCov.SelfEmployedNetIncome_amt
      cpEarnings.TotalOtherExpensesClaimed = earningsCov.TotalOtherExpensesClaimed_amt
      if (FeatureToogleUtil.overseasIncomeEnabled(earningsCov.Branch.LevyYear_ACC)) {
        cpEarnings.TotalOverseasIncome = earningsCov.TotalOverseasIncome_amt
      }
      res.CoverPlusEarnings = cpEarnings
    }
    return res;
  }

  public static function convertToCoveragesDTO(coverages: INDCoPCov[], lineName : String) : CoverageDTO[] {
    return coverages.map(\cov -> PolicyLineUtil_ACC.createBaseCoverage(lineName))
  }

  public static function convertToCoverablesDTO(coverables : INDCoPCov[]) : CoverableDTO_ACC[] {
    return coverables.map(\ cov -> PolicyLineUtil_ACC.createBaseCPCoverable(cov))
  }

  public static function convertToHistoricalEarningsDTO(period : PolicyPeriod) : HistoricalEarnings_ACC[] {
    var minmaxEarnings = new nz.co.acc.lob.cpx.INDCPXCalculateMaximumPreviousEarnings_ACC(period)
    return PolicyLineUtil_ACC.convertToHistoricalEarnings(minmaxEarnings.SeActualLiableEarnings)
  }
}