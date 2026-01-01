package gw.apd.model.generate

uses entity.APDCoverable

@Export
class RiskEntityUIPageGenerationHelper {

  public static function showExposureListOnPanelSet(coverable : APDCoverable, fieldMax : int) : boolean {
    return coverable.Fields.Count <= fieldMax and coverable.Exposures.Count > 0
  }

  public static function showCoverableListOnPanelSet(coverable : APDCoverable, fieldMax : int) : boolean {
    var numChildren = coverable.ChildCoverables.Count
    return coverable.Fields.Count <= fieldMax and
        (numChildren == 1 or (numChildren > 0 and not(coverable typeis APDProductLine)))
  }

  public static function generateExposureSync(exposure : APDExposure, coverableVariableName : String) : String {
    var parent = exposure.Coverable
    var childrenToSync = "${coverableVariableName}.${parent.LinePrefix + exposure.TypeName}s"
    return "gw.web.rules.APDRulesHelper.onEnter(${childrenToSync}, jobWizardHelper)"
  }

  public static function generateCoverableSync(coverable : APDCoverable, coverableVariableName : String) : String {
    var childrenToSync = "${coverableVariableName}.${coverable.LinePrefix + coverable.TypeName}s"
    var identifierFields = identifierFieldList(coverable)
    if (identifierFields.HasContent) {
      var fieldList = childrenToSync + ".first().IdentifierPropertyList"
      return "gw.web.rules.APDRulesHelper.onEnter(${childrenToSync}, ${fieldList}, jobWizardHelper)"
    }

    return ""
  }

  public static function generateOnEnterAttribute(coverable : APDCoverable, fieldMax : int, coverableVariableName : String) : String {
    var afterEnterSyncCoverable = "gw.web.rules.APDRulesHelper.onEnter(${coverableVariableName}, jobWizardHelper)"
    if (showExposureListOnPanelSet(coverable, fieldMax)) {
      var exposure = coverable.Exposures.orderBy(\e -> e.Name).first()
      afterEnterSyncCoverable += "; " + generateExposureSync(exposure, coverableVariableName)
    } else if (showCoverableListOnPanelSet(coverable, fieldMax)) {
      var childCoverable = coverable.ChildCoverables.orderBy(\cc -> cc.Name).first()
      var coverableSync = generateCoverableSync(childCoverable, coverableVariableName)
      if (coverableSync.HasContent) {
        afterEnterSyncCoverable += "; " + coverableSync
      }
    }

    return afterEnterSyncCoverable
  }

  private static function identifierFieldList(coverable : APDCoverable) : String {
    var identifierFields = coverable.Fields.where(\field -> field.Identifier).orderBy(\f -> f.Sequence)
    if (identifierFields.HasElements) {
      return "{ &quot;" + identifierFields.map(\field -> field.Name).join("&quot;, &quot;") + "&quot; }"
    }

    return ""
  }

}