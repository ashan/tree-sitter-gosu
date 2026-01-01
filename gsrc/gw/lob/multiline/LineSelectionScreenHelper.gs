package gw.lob.multiline

uses gw.api.productmodel.PolicyLinePattern

@Export
class LineSelectionScreenHelper {

  public static function createOrRemoveLine(period : PolicyPeriod, linePattern : PolicyLinePattern, shouldCreateLine : boolean) {
    if (shouldCreateLine and not period.getLineExists(linePattern)) {
      period.createPolicyLine(linePattern)
    } else if (not shouldCreateLine and period.getLineExists(linePattern)) {
      period.removeFromLines(period.getLine(linePattern))
      period.updateTerritoryCodes()
    }
  }
}