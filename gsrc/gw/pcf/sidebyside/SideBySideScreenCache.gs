package gw.pcf.sidebyside

uses gw.api.productmodel.CovTermPattern
uses gw.api.productmodel.CoveragePattern
uses gw.util.Pair

@Export
class SideBySideScreenCache {
  var _covAvail : Map<Pair<CoveragePattern, Coverable>, Boolean> as CovAvail = {}
  var _covTermAvail : Map<Pair<CovTermPattern, Coverable>, Boolean> as CovTermAvail = {}
  var _covIssue : Map<Coverable, List<gw.web.productmodel.ProductModelSyncIssueWrapper>> as CovIssues = {}
  var _covAllowToggle : Map<Pair<CoveragePattern, Coverable>, Boolean> as CovAllowToggle = {}

  function clearCache() {
    CovAvail = {}
    CovTermAvail = {}
    CovIssues = {}
    CovAllowToggle = {}
  }
}