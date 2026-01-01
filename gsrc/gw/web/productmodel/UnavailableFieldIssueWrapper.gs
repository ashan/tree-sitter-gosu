package gw.web.productmodel

uses gw.api.locale.DisplayKey
uses gw.api.web.productmodel.UnavailableFieldIssue

@Export
class UnavailableFieldIssueWrapper extends DataModelSyncIssueWrapper<UnavailableFieldIssue> {

  construct(myIssue : UnavailableFieldIssue) {
    super(myIssue)
  }

  override property get Severity() : ProductModelSyncIssueSeverity {
    return INFO
  }

  override property get BaseMessage() : String {
    return DisplayKey.get("Web.JobWizard.DataModelSync.UnavailableFieldRemoved", Issue.propertyDescription())
  }

  override property get ShouldFixDuringNormalSync() : boolean {
    return true
  }

  override property get ShouldDisplayDuringNormalSync() : boolean {
    return true
  }

  override property get ShouldFixDuringQuote() : boolean {
    return true
  }

  override property get ShouldDisplayDuringQuote() : boolean {
    return true
  }

}