<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}.${APDConstants.RATING}"
var extPackage = "${productLine.LOBPackageName}.${APDConstants.RATING}"

var costTypes = productLine.UniqueCostDefinitions?.map(\cost -> {
  var costName = (cost typeis APDCoverageCostDefinition)
      ? (cost as APDCoverageCostDefinition).Coverage.Coverable.TypeName + "Cov"
      : (cost as APDRiskCostDefinition).Coverable.TypeName
  return "${productLine.LinePrefix}${costName}Cost"
})
costTypes.sort()
%>
package ${basePackage}

<%for(var costType in costTypes) {%>
uses ${extPackage}.${costType}Data
<%}%>
uses gw.financials.Prorater
uses gw.job.RenewalProcess
uses gw.plugin.Plugins
uses gw.plugin.policyperiod.IPolicyTermPlugin
uses gw.rating.AbstractRatingEngine
<%if (productLine.UniqueCostDefinitions.HasElements) {%>
uses gw.rating.CostData
<%}%>
uses gw.rating.RateFlowLogger

uses java.math.BigDecimal
uses java.math.RoundingMode

@Export
abstract class ${productLine.LinePrefix}RatingEngineBase extends AbstractRatingEngine<entity.${productLine.QualifiedName}> {

  static var _rfLogger = RateFlowLogger.Logger

  var _minimumRatingLevel : typekey.RateBookStatus
  var _baseRatingDate : Date
  var _uwCompanyRateFactor : BigDecimal
  var _jurisdiction : typekey.Jurisdiction
  var _renewal : boolean
  var _linePatternCode : String
  var _offeringCode : String

  construct(line : entity.${productLine.QualifiedName}) {
    this(line, RateBookStatus.TC_ACTIVE)
  }

  construct(line : entity.${productLine.QualifiedName}, minimumRatingLevel : typekey.RateBookStatus) {
    super(line)
    _jurisdiction = line.Branch.BaseState
    _baseRatingDate = line.Branch.RateAsOfDate
    _uwCompanyRateFactor = line.Branch.getUWCompanyRateFactor(_baseRatingDate, _jurisdiction)
    _minimumRatingLevel = minimumRatingLevel
    _renewal = line.Branch.JobProcess typeis RenewalProcess
    _linePatternCode = line.PatternCode
    var offering = line.Branch.Offering
    if (offering != null) {
      _offeringCode = offering.PublicID
    }
  }

<%if (productLine.UniqueCostDefinitions.HasElements) {%>
  // Used by the extractCostDatasFromExistingCosts method.  Must be implemented if that method is going to be called
  override protected function createCostDataForCost(cost : Cost) : CostData {
    var costData : CostData

    switch (typeof cost) {
<%for(var costType in costTypes) {%>
      case ${costType}:
        costData = new ${costType}Data(cost, RateCache)
        break
<%}%>
      default:
        throw "Unexpected cost type \${cost.DisplayName}"
    }

    return costData
  }

<%}%>
  /******
   * This default version of this method will return all of the Costs on a policy for the slice's effective date.  If some of the
   * costs on a policy are created as part of the "rate window" portion of the rating algorithm (that is, they are created at the
   * end for the entire period rather than created as part of rating each slice in time), then these costs should be excluded
   * from what is returned by this method.  Override this method to return only the types of costs that would be created during the
   * rateSlice portion of the algorithm in that case.
   ******/
  override protected function existingSliceModeCosts() : Iterable<Cost> {
    return PolicyLine.Costs
  }

  protected property get RoundingLevel() : int {
    return PolicyLine.Branch.Policy.Product.QuoteRoundingLevel
  }

  protected property get RoundingMode() : RoundingMode {
    return PolicyLine.Branch.Policy.Product.QuoteRoundingMode
  }

  protected function getRateBook(refDate : Date) : RateBook {
    return RateBook.selectRateBook(refDate, _baseRatingDate, _linePatternCode, _jurisdiction, _minimumRatingLevel, _renewal, _offeringCode)
  }

  override property get NumDaysInCoverageRatedTerm() : int {
    var prorater = Prorater.forFinancialDays(TC_PRORATABYDAYS)
    var endDate = Plugins.get(IPolicyTermPlugin).calculatePeriodEnd(Branch.StartOfRatedTerm, TermType.TC_ANNUAL, Branch) // almost all pricing is based on annual rates; change if necessary
    return prorater.financialDaysBetween(endDate, Branch.StartOfRatedTerm)
  }

}