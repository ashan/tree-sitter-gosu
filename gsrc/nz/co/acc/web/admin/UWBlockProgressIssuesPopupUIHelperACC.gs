package nz.co.acc.web.admin

uses gw.api.locale.DisplayKey

/**
 * Copied from gw.web.admin.UWBlockProgressIssuesPopupUIHelper
 *
 * NTK-668: Added cases for TC_BLOCKSAUDITISSUANCE_ACC
 */
class UWBlockProgressIssuesPopupUIHelperACC {

  static function titleForBlockingPoint(blockingPoint : UWIssueBlockingPoint) : String {
    switch (blockingPoint) {
      case TC_BLOCKSQUOTE: return DisplayKey.get('Web.Job.Warning.UWIssue.PreQuoteIssues')
      case TC_BLOCKSBIND: return DisplayKey.get('Web.Job.Warning.UWIssue.PreBindIssues')
      case TC_BLOCKSISSUANCE: return DisplayKey.get('Web.Job.Warning.UWIssue.PreIssuanceIssues')
      case TC_REJECTED : return DisplayKey.get('Web.Job.Warning.UWIssue.PreQuoteIssues')
      case TC_BLOCKSAUDITISSUANCE_ACC : return DisplayKey.get('Web.Job.Warning.UWIssue.AuditIssues')
    }
    throw new java.lang.IllegalStateException("Not expecting blocking point ${blockingPoint}")
  }

  static function headerForBlockingPoint(blockingPoint : UWIssueBlockingPoint) : String {
    switch (blockingPoint) {
      case TC_BLOCKSQUOTE: return DisplayKey.get('Web.Job.Warning.UWIssue.PreQuoteIssues.Description')
      case TC_BLOCKSBIND: return DisplayKey.get('Web.Job.Warning.UWIssue.PreBindIssues.Description')
      case TC_BLOCKSISSUANCE: return DisplayKey.get('Web.Job.Warning.UWIssue.PreIssuanceIssues.Description')
      case TC_REJECTED : return DisplayKey.get('Web.Job.Warning.UWIssue.PreQuoteRejectIssues.Description')
      case TC_BLOCKSAUDITISSUANCE_ACC : return DisplayKey.get('Web.Job.Warning.UWIssue.AuditIssues.Description')
    }
    throw new java.lang.IllegalStateException("Not expecting blocking point ${blockingPoint}")
  }

  static function descriptionAndCount(issueList : List<UWIssue>) : String {
    var issueDescription = issueList.get(0).ShortDescription
    var issueCount = issueList.Count
    if (issueCount > 1)
      return issueDescription + " (" + issueCount + ")"
    else
      return issueDescription
  }
}