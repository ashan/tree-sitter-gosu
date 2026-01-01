package nz.co.acc.edge.capabilities.policy.lob.util

uses edge.capabilities.currency.dto.AmountDTO
uses edge.capabilities.policy.dto.CoverageDTO
uses edge.capabilities.policy.lob.dto.PolicyLineBaseDTO
uses edge.util.helper.CurrencyOpUtil
uses gw.api.locale.DisplayKey
uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.common.function.Funxion
uses nz.co.acc.edge.capabilities.policy.dto.BICCodeDTO_ACC
uses nz.co.acc.edge.capabilities.policy.dto.CoverableDTO_ACC
uses nz.co.acc.edge.capabilities.policy.lob.cp.dto.HistoricalEarnings_ACC
uses nz.co.acc.edge.capabilities.policy.lob.util.function.GetCPEmployeeStatus
uses nz.co.acc.edge.capabilities.policy.lob.util.function.decorator.GetCPLiableEarningCovInput
uses nz.co.acc.lob.cpx.INDCPXCalculateMaximumPreviousEarnings_ACC
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC

uses java.math.BigDecimal

/**
 * Created by nitesh.gautam on 27-Mar-17.
 */
class PolicyLineUtil_ACC {
  public static function fillBaseCoverage(res : CoverageDTO, coverage : INDCoPLineCov) {
    res.Name = coverage.Pattern.Name
  }

  /**
   * Creates a coverage DTO.
   */
  public static function createBaseCoverage(lineName : String) : CoverageDTO {
    final var res = new CoverageDTO()
    res.Name = lineName
    res.Premium = null
    return res
  }

  /**
   * Creates a Coverable DTO.
   */
  public static function createBaseCPCoverable(coverable : INDCoPCov) : CoverableDTO_ACC {
    final var res = new CoverableDTO_ACC()

    var basis = new GetCPLiableEarningCovInput(coverable).Dynamic
    var isFullTime = Funxion.buildProcessor(new GetCPEmployeeStatus()).process(basis)
    res.EmployeeStatus = isFullTime ? DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.FullTime") : DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.PartTime")

    return res
  }

  public static function createBaseCPXCoverable(coverable : CPXInfoCov_ACC) : CoverableDTO_ACC {
    final var res = new CoverableDTO_ACC()

    res.FixedID = coverable.FixedId.Value
    res.PublicID = coverable.PublicID
    res.AgreedLevelOfCover = coverable.AgreedLevelOfCover
    res.RequestedLevelOfCover = coverable.RequestedLevelOfCover
    res.PeriodStart = coverable.PeriodStart
    res.PeriodEnd = coverable.PeriodEnd
    res.ApplicationReceived = coverable.ApplicationReceived
    res.CoverType = (coverable.CoverTypeStandard ? DisplayKey.get("Web.CoverPlusExtra_ACC.Coverage.CoverType.Standard") :
                                                   DisplayKey.get("Web.CoverPlusExtra_ACC.Coverage.CoverType.LLWC")).toLowerCase()
    res.MaxCoverPermitted = coverable.MaxCoverPermitted.Amount

    return res
  }

  public static function createBICCode(bicCode : PolicyLineBusinessClassificationUnit_ACC) : BICCodeDTO_ACC {
    final var res = new BICCodeDTO_ACC()
    res.CUCode = bicCode.CUCode
    res.CUDescription = bicCode.CUDescription
    res.BicCode = bicCode.BICCode
    return res
  }

  public static function createBICCodeFromBusinessIndustryCode(bicCode : BusinessIndustryCode_ACC) : BICCodeDTO_ACC {
    final var res = new BICCodeDTO_ACC()
    res.CUCode = bicCode.ClassificationUnit_ACC.ClassificationUnitCode
    res.CUDescription = bicCode.ClassificationUnit_ACC.ClassificationUnitDescription
    res.BicCode = bicCode.BusinessIndustryCode
    return res
  }

  public static function fillExtendedBaseProperties(res : PolicyLineBaseDTO, item :  PolicyLine, chatgePatterns : List<ChargePattern>) {
    if(item.AssociatedPolicyPeriod.Status != PolicyPeriodStatus.TC_DRAFT) {
      res.TotalPremium = AmountDTO.fromMonetaryAmount(CurrencyOpUtil.sum(
          item.Costs.where(\cost -> chatgePatterns.contains(cost.ChargePattern))))
    } else {
      res.TotalPremium = AmountDTO.fromMonetaryAmount(new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD))
    }
  }

  public static function convertToHistoricalEarnings(earnings : INDCPXCalculateMaximumPreviousEarnings_ACC.PreviousEarnings) : HistoricalEarnings_ACC[] {
    var earningsList = new ArrayList<HistoricalEarnings_ACC>()
    earningsList.add(new HistoricalEarnings_ACC(earnings?.Last?.Amount ?: BigDecimal.ZERO, earnings.LastLevyYear != null ? earnings?.LastLevyYear : 0))
    earningsList.add(new HistoricalEarnings_ACC(earnings?.Second?.Amount ?: BigDecimal.ZERO, earnings.LastLevyYear != null ? (earnings?.LastLevyYear - 1) : 0))
    earningsList.add(new HistoricalEarnings_ACC(earnings?.Third?.Amount ?: BigDecimal.ZERO, earnings.LastLevyYear != null ? (earnings?.LastLevyYear - 2) : 0))
    return earningsList.toTypedArray()
  }
}