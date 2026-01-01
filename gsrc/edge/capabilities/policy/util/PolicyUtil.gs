package edge.capabilities.policy.util

uses edge.capabilities.currency.dto.AmountDTO
uses java.util.Date

final class PolicyUtil {
  static function getPolicyPeriodPremium(policy : PolicyPeriod) : AmountDTO {
    return AmountDTO.fromMonetaryAmount(policy.TotalPremiumRPT)
  }
  
  
  static function getLatestPolicyPeriodByPolicyNumber(policyNumber: String) : PolicyPeriod {
    var endOfSelectedDate = gw.api.util.DateUtil.endOfDay(Date.Now)
    return entity.Policy.finder.findPolicyPeriodByPolicyNumberAndAsOfDate(policyNumber, endOfSelectedDate)
  }
}
