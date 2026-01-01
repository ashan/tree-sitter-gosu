package gw.plugin.diff.impl

uses gw.api.diff.DiffItem
uses gw.pl.logging.LoggerCategory

/**
 * Helper class for adding and filtering diff items
 * <p>
 * ACC Customizations.
 */
class DiffHelper_ACC {

  /**
   * Filters diff items for: Manual policy change - apply changes to next period
   */
  function filterDiffItemsForApplyChanges(diffItems : List<DiffItem>) {
    diffItems.removeWhere(\diffItem -> not shouldKeepDiffItem(diffItem))
  }

  function shouldKeepDiffItem(diffItem : DiffItem) : Boolean {
    var shouldKeep = isDiffItemAllowedForApplyChanges(diffItem)

    if (LoggerCategory.CONFIG.DebugEnabled) {
      if (not shouldKeep) {
        if (diffItem.isProperty()) {
          var propertyName = diffItem.asProperty().PropertyInfo.Name
          LoggerCategory.CONFIG.debug("DiffHelper_ACC filtered: propertyName=${propertyName}, type=${typeof diffItem.Bean}, bean=${diffItem.Bean}")
        } else {
          LoggerCategory.CONFIG.debug("DiffHelper_ACC filtered: type=${typeof diffItem.Bean}, bean=${diffItem.Bean}")
        }
      }
    }

    return shouldKeep
  }

  private function isDiffItemAllowedForApplyChanges(diffItem : DiffItem) : Boolean {
    switch (typeof diffItem.Bean) {
      case PolicyLineBusinessClassificationUnit_ACC:
      case INDCoPCov:
        return true;
      case INDLiableEarnings_ACC:
        return shouldKeepIndLiableEarningsDiffItem(diffItem)
      case INDCPXLine:
//        return shouldKeepINDCPXLineDiffItem(diffItem)
        return false
      default:
        return false
    }
  }

  /**
   * Carry forward CP employment status
   */
  private function shouldKeepIndLiableEarningsDiffItem(diffItem : DiffItem) : Boolean {
    return diffItem.isProperty()
        and diffItem.asProperty().PropertyInfo.Name == "FullTime"
  }

  /**
   * Carry forward CPX employment status
   */
  private function shouldKeepINDCPXLineDiffItem(diffItem : DiffItem) : Boolean {
    return diffItem.isProperty()
        and diffItem.asProperty().PropertyInfo.Name == "EmploymentStatus"
  }
}
