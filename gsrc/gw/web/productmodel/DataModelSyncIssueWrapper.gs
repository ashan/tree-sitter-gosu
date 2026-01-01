package gw.web.productmodel

uses gw.api.web.productmodel.DataModelSyncIssue
uses gw.api.web.productmodel.MissingFieldIssue
uses gw.api.web.productmodel.UnavailableFieldIssue
uses gw.api.web.productmodel.UnavailableTypeKeyFieldValueIssue

@Export
abstract class DataModelSyncIssueWrapper<T extends DataModelSyncIssue> extends ProductModelSyncIssueWrapper<T> {

  construct(myIssue : T) {
    super(myIssue)
  }

  static function wrapIssue(issue : DataModelSyncIssue) : DataModelSyncIssueWrapper {
    switch (typeof issue) {
      case UnavailableFieldIssue:
        return new UnavailableFieldIssueWrapper(issue)

      case MissingFieldIssue:
        return new MissingFieldIssueWrapper(issue)

      case UnavailableTypeKeyFieldValueIssue:
        return new UnavailableTypeKeyFieldValueIssueWrapper(issue)

      default:
        throw new IllegalArgumentException("No wrapper class was found for issue type " + (typeof issue))
    }
  }

}