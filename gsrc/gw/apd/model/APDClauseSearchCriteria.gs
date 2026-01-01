package gw.apd.model

uses gw.api.locale.DisplayKey
uses gw.api.util.TypeUtil

uses java.io.Serializable

uses entity.APDClause
uses entity.APDCoverable

@Export
class APDClauseSearchCriteria implements Serializable {

  var _keyword : String as Keyword
  var _clauseCategory: APDClauseCategory as ClauseCategory
  var _coverable: APDCoverable as Coverable
  var _searchType : CoveragePatternSearchType as SearchType

  protected property get HasMinimumSearchCriteria() : boolean {
    return true
  }

  protected property get MinimumSearchCriteriaMessage() : String {
    return DisplayKey.get("Web.Search.SearchCriteria.ClausePattern.MinCriteria")
  }

  function doSearch() : ArrayList<APDClause> {
    var clauseTypes : List<Type< APDClause >>
    switch (_searchType) {
      case CoveragePatternSearchType.TC_COVERAGE:
        clauseTypes = {APDCoverage}
        break
      case CoveragePatternSearchType.TC_CONDITION:
        clauseTypes = {APDCondition}
        break
      case CoveragePatternSearchType.TC_EXCLUSION:
        clauseTypes = {APDExclusion}
        break
      case CoveragePatternSearchType.TC_EXCLCOND:
        clauseTypes = {APDCondition, APDExclusion}
        break
      default:
        clauseTypes = {APDCoverage, APDExclusion, APDCondition}
    }

    var allClausePatterns = new ArrayList<APDClause>()
    allClausePatterns.addAll(_coverable.Clauses.where(\c -> isSearchedType(clauseTypes, c)).toList())

    if (_clauseCategory != null) {
      allClausePatterns.removeAll(allClausePatterns.where(\ clausePattern -> clausePattern.ClauseCategory != _clauseCategory).toList())
    }

    if (_keyword != null) {
      allClausePatterns.removeAll(allClausePatterns.where(\ c -> not c.Name.containsIgnoreCase(_keyword)))
    }


    return allClausePatterns
  }

  private function isSearchedType(clauseTypes : List<Type< APDClause >>, pattern : APDClause) : boolean {
    for (t in clauseTypes) {
      if (TypeUtil.isNominallyOrStructurallyAssignable(t, typeof pattern)) {
        return true
      }
    }
    return false
  }

  function containsResult(pattern: APDClause): boolean {
    return doSearch().contains(pattern)
  }
}
