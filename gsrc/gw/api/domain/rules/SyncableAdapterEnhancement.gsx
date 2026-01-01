package gw.api.domain.rules

uses gw.lang.reflect.IPropertyInfo
uses gw.web.productmodel.DataModelSyncIssueWrapper

enhancement SyncableAdapterEnhancement : SyncableAdapter {

  function syncFieldsAndFixIssues() : List<DataModelSyncIssueWrapper> {
    return syncFieldsAndFixIssues(this.SyncableFields*.PropertyInfo.toList())
  }

  function syncFieldsAndFixIssues(fields : List<IPropertyInfo>) : List<DataModelSyncIssueWrapper> {
    var issueWrappers = this.syncFields(fields)
        .map(\issue -> DataModelSyncIssueWrapper.wrapIssue(issue))

    issueWrappers.fixDuringNormalSync(this.Owner)

    return issueWrappers
  }

}
