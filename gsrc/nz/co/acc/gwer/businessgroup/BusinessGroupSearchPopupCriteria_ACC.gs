package nz.co.acc.gwer.businessgroup

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Key
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.edge.capabilities.policy.util.PolicyUtil_ACC
uses nz.co.acc.gwer.ERSearchResultsCounter_ACC
uses nz.co.acc.gwer.util.ERProcessUtils_ACC

class BusinessGroupSearchPopupCriteria_ACC extends BusinessGroupSearchCriteria_ACC {
  private static var _logger = StructuredLogger.INTEGRATION.withClass(BusinessGroupSearchPopupCriteria_ACC)

  construct(levyYear : Integer) {
    this.LevyYear = levyYear
  }

  static function validateLevyYear(levyYear : Integer) {
    if(levyYear == null) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.NoLevyYear_ACC"))
    }
  }

  function performSearch(rowCounter : ERSearchResultsCounter_ACC) : BusinessGroupSearchResult_ACC[] {
    var searchResult = new ArrayList<BusinessGroupSearchResult_ACC>()
    validateLevyYear(this.LevyYear)
    if(this.BusinessGroupID == null and this.ACCPolicyID == null and this.Name == null) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.BusinessGroupSearch.InsufficientSearchInfo_ACC"))
    }
    rowCounter.TotalRows = 0

    if(this.BusinessGroupID != null) {
      var bgmQuery = Query.make(ERBusinessGroupMember_ACC)
      bgmQuery.compare(ERBusinessGroupMember_ACC#ERBusinessGroup, Relop.Equals, new Key(ERBusinessGroup_ACC, this.BusinessGroupID))
      if(this.ACCPolicyID != null) {
        bgmQuery.compare(ERBusinessGroupMember_ACC#ACCPolicyID_ACC, Relop.Equals, this.ACCPolicyID)
      }
      var results = bgmQuery.select()
      if(results.HasElements) {
        results.each(\elt -> {
          var result = new BusinessGroupSearchResult_ACC()
          result.ACCPolicyID = elt.ACCPolicyID_ACC
          result.BusinessGroupID = elt.ERBusinessGroup.ID.Value
          searchResult.add(result)
        })
        return searchResult.toTypedArray()
      }
    } else if (this.ACCPolicyID != null) {

      var bgmQuery = Query.make(ERBusinessGroupMember_ACC)
      if(this.ACCPolicyID != null) {
        bgmQuery.compare(ERBusinessGroupMember_ACC#ACCPolicyID_ACC, Relop.Equals, this.ACCPolicyID)
      }
      var results = bgmQuery.select()
      if(results.HasElements) {
        results.each(\elt -> {
          var result = new BusinessGroupSearchResult_ACC()
          result.ACCPolicyID = elt.ACCPolicyID_ACC
          result.BusinessGroupID = elt.ERBusinessGroup.ID.Value
          searchResult.add(result)
        })
      } else {
        var policyTerm = new ERProcessUtils_ACC().getLatestPolicyTermByACCPolicyID(this.ACCPolicyID)
        if(policyTerm != null) {
          var result = new BusinessGroupSearchResult_ACC()
          result.ACCPolicyID = policyTerm.ACCPolicyID_ACC
          searchResult.add(result)
        }
      }

      return searchResult.toTypedArray()
    }

    return null
  }
}