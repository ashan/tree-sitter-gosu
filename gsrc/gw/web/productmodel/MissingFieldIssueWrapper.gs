package gw.web.productmodel

uses gw.api.locale.DisplayKey
uses gw.api.web.productmodel.MissingFieldIssue

@Export
class MissingFieldIssueWrapper extends DataModelSyncIssueWrapper<MissingFieldIssue> {

  construct(myIssue : MissingFieldIssue) {
    super(myIssue)
  }

  override property get Severity() : ProductModelSyncIssueSeverity {
    return Issue.Fixed ? INFO : ERROR
  }

  override property get BaseMessage() : String {
    if (Issue.Fixed) {
      return DisplayKey.get("Web.JobWizard.DataModelSync.MissingFieldAdded", Issue.propertyDescription())
    } else {
      return DisplayKey.get("Web.JobWizard.DataModelSync.MissingFieldNotAdded", Issue.propertyDescription())
    }
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