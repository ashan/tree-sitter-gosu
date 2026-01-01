package gw.web.productmodel

uses gw.api.locale.DisplayKey

@Export
class UnavailableQuestionIssueWrapper extends ProductModelSyncIssueWrapper<gw.api.web.productmodel.UnavailableQuestionIssue> {

  construct(myIssue : gw.api.web.productmodel.UnavailableQuestionIssue) {
    super(myIssue)
  }
  
  override property get BaseMessage() : String {
    return DisplayKey.get("Web.JobWizard.ProductModelSync.UnavailableQuestionNoMessageConfigured")
  }

  override property get Severity() : ProductModelSyncIssueSeverity {
    return INFO
  }
  
  override property get ShouldFixDuringNormalSync() : boolean { return true }
  
  override property get ShouldDisplayDuringNormalSync() : boolean { return false }
  
  override property get ShouldFixDuringQuote() : boolean { return true }
  
  override property get ShouldDisplayDuringQuote() : boolean { return false }
}
