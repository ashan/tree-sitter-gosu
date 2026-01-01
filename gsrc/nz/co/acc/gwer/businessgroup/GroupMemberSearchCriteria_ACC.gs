package nz.co.acc.gwer.businessgroup

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.gwer.ERSearchResultsCounter_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.StoreProcController_ACC
uses nz.co.acc.gwer.util.ERUIUtils_ACC

uses java.io.Serializable


class GroupMemberSearchCriteria_ACC implements Serializable {
  private static var _logger = StructuredLogger.INTEGRATION.withClass(GroupMemberSearchCriteria_ACC)

  private var _companyId : Integer as CompanyID

  private var _accPolicyId : String as ACCPolicyID

  private var _name : String as Name

//  function performSearch(rowCounter : ERSearchResultsCounter_ACC) : BusinessGroupSearchResult_ACC[] {
//    if(this.CompanyID == null and this.ACCPolicyID == null and this.Name == null) {
//      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.GroupMemberSearch.InsufficientSearchInfo_ACC"))
//    }
//
//    var proc = new StoreProcController_ACC()
//    return proc.performSearch(rowCounter, 0, _accPolicyId, _name)
//  }

  function performERSearch(rowCounter : ERSearchResultsCounter_ACC) : List<BusinessGroupSearchResult_ACC> {

    if(this.CompanyID == null and this.ACCPolicyID == null and this.Name == null) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.GroupMemberSearch.InsufficientSearchInfo_ACC"))
    }

    return new ERUIUtils_ACC().searchBusinessGroups(this.ACCPolicyID, this.CompanyID, this.Name)
  }

}