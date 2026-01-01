package gw.apd.policy

@Export
class APDLineSelectionCheckboxWrapper {

  private var _policyLinePattern : APDProductLine
  private var _period : PolicyPeriod
  private var _checkBoxValue : boolean

  construct(pattern : APDProductLine, period : PolicyPeriod){
    _policyLinePattern = pattern
    _period = period
    _checkBoxValue = _period.ManualLine.getLineExists(pattern)
  }

  property get Value() : boolean {
    return _checkBoxValue
  }

  property set Value(shouldCreateLine : boolean) {
    this.createOrRemoveLine(shouldCreateLine)
    _checkBoxValue = _period.ManualLine.getLineExists(_policyLinePattern)
  }

  private function createOrRemoveLine(shouldCreateLine : boolean) {
    if (shouldCreateLine and not _period.ManualLine.getLineExists(_policyLinePattern)) {
      _policyLinePattern.buildRiskPolicyLine( _period.ManualLine)
    } else if (not shouldCreateLine and _period.ManualLine.getLineExists(_policyLinePattern)) {
      _period.ManualLine.removeFromRiskCoverables(_period.ManualLine.getLine(_policyLinePattern))
    }
  }
}