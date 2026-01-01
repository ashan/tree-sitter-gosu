package edge.capabilities.quote.draft
uses java.util.Date
uses gw.api.util.DateUtil

/**
 * Utility class to isolate platform differences in IPolicyTermPlugin
 */
class PeriodEndUtil {

  static function calculatePeriodEnd(effectiveDate:Date,termType:TermType, policyPeriod:PolicyPeriod) : Date {
      var policyPeriodPlugin = gw.plugin.Plugins.get( gw.plugin.policyperiod.IPolicyTermPlugin )
      return DateUtil
          .mergeDateAndTime(policyPeriodPlugin.calculatePeriodEnd(effectiveDate, termType, policyPeriod), policyPeriod.PeriodEnd)
  }
}
