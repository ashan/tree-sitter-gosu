package gw.web.productmodel

uses gw.api.locale.DisplayKey
uses gw.api.web.productmodel.UnavailableTypeKeyFieldValueIssue

@Export
class UnavailableTypeKeyFieldValueIssueWrapper extends DataModelSyncIssueWrapper<UnavailableTypeKeyFieldValueIssue> {

  construct(myIssue : UnavailableTypeKeyFieldValueIssue) {
    super(myIssue)
  }

  override property get BaseMessage() : String {
    return DisplayKey.get("Web.JobWizard.DataModelSync.UnavailableTypekeyValue", Issue.propertyDescription(), Issue.Value.DisplayName);
  }

  override property get Severity() : ProductModelSyncIssueSeverity {
    return Issue.Fixed ? WARNING : ERROR
  }

  override property get ShouldFixDuringNormalSync() : boolean {
    return true
  }

  override property get ShouldDisplayDuringNormalSync() : boolean {
    return true
  }

  override property get ShouldFixDuringQuote() : boolean {
    return false
  }

  override property get ShouldDisplayDuringQuote() : boolean {
    return true
  }

}

