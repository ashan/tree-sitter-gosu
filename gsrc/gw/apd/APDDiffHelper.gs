package gw.apd
uses gw.api.diff.DiffItem
uses gw.plugin.diff.impl.DiffHelper

@Export
class APDDiffHelper extends DiffHelper<APDManualPolicyLine>{

  construct(reason : DiffReason, polLine1 : APDManualPolicyLine, polLine2 : APDManualPolicyLine) {
    super(reason, polLine1, polLine2)
  }

  /**
   * Should be used to add diff items that apply to this LOB, e.g. line-level coverages
   * @param diffItems - list of diff items to add to
   * @return List<DiffItem> - returns the list of diff items that we've modified
   */
  override function addDiffItems(diffItems : List<DiffItem>) : List<DiffItem> {
    diffItems = super.addDiffItems(diffItems)

    diffItems.addAll(this.compareLineField("RiskCoverables", 5))

    return diffItems
  }

  /**
   * Filters diff items that apply to this LOB
   * @param diffItems - list of diff items to filter
   * @return List<DiffItem> - returns the list of diff items that we've modified
   */
  override function filterDiffItems(diffItems : List<DiffItem>) : List<DiffItem> {
    diffItems = super.filterDiffItems(diffItems)

    // Add line-specific filtering logic here

    return diffItems
  }
}