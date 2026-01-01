package nz.co.acc.lob.util

uses gw.api.productmodel.PolicyLinePattern

/**
 * Created by GallagB on 5/12/2016.
 */
class LineSelectionScreenHelper_ACC {

  private var _policyLinePattern : PolicyLinePattern
  private var _period : PolicyPeriod
  private var _checkBoxValue : boolean

  construct(pattern : PolicyLinePattern, period : PolicyPeriod){
    _policyLinePattern = pattern
    _period = period
    _checkBoxValue = _period.getLineExists(pattern)
  }

  property get Value() : boolean {
    return _checkBoxValue
  }

  property set Value(shouldCreateLine : boolean) {
    createOrRemoveLine(_period, _policyLinePattern, shouldCreateLine)
    _checkBoxValue = _period.getLineExists(_policyLinePattern)
  }

  public static function createOrRemoveLine(period : PolicyPeriod, linePattern : PolicyLinePattern, shouldCreateLine : boolean) {
    if (shouldCreateLine and not period.getLineExists(linePattern)) {
      period.createPolicyLine(linePattern)
    } else if (not shouldCreateLine and period.getLineExists(linePattern)) {
      period.removeFromLines(period.getLine(linePattern))
      period.updateTerritoryCodes()
    }
  }

  /**
   * Determine the availability of the product - initially designed to tie it to a permission
   * @param policyLinePattern
   * @return
   */
  public static function determineAvailability (policyLinePattern: PolicyLinePattern, policyPeriod : PolicyPeriod) : boolean {
    var editable : boolean = false
    if (policyLinePattern.PolicyLineSubtype == TC_INDCOPLINE) {
      editable = false
    } else if (policyLinePattern.PolicyLineSubtype == TC_INDCPXLINE) {
      // DE1332 disable if this is a submission
      editable = perm.System.editcpxacc and !(policyPeriod.Job typeis Submission)
    }
    return editable
  }

}