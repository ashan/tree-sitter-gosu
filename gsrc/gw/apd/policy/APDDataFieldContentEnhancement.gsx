package gw.apd.policy

uses entity.APDDataField
uses gw.api.locale.DisplayKey

uses java.math.BigDecimal

/**
 * Agile Product Developer
 */
@Export
enhancement APDDataFieldContentEnhancement : APDDataField {

  /**
   * Gets the AccountLocation from the PolicyLocation
   */
  property get AccountLocation() : AccountLocation {
    return this.Location.AccountLocation
  }

  /**
   * Sets the AccountLocation and ensures that GarageLocation is also set properly
   */
  property set AccountLocation(acctLoc : AccountLocation) {
    // See if there's already a PolicyLocation which points to the AccountLocation.
    // There should be at most one.
    var policyLocs = this.Branch.PolicyLocations.where(\ p -> p.AccountLocation == acctLoc)
    if (policyLocs.Count > 1) {
      throw "Expected only one PolicyLocation associated with the AccountLocation: " + acctLoc
    }
    var policyLoc = policyLocs.first()

    // Create a new PolicyLocation if neccessary
    if (policyLoc == null && acctLoc != null) {
      policyLoc = this.Branch.newLocation(acctLoc)
      for(var tc in policyLoc.TerritoryCodes)
        tc.fillWithFirst()
    }

    if (policyLoc != null) {
      this.Location = policyLoc
    }
  }

  property get MinMaxError() : String {
    switch (this.Attribute.Type) {
      case APDFieldType.TC_BIGDECIMAL :
      case APDFieldType.TC_MONEY :
        return getMinMaxErrorMessageForDecimal(\ruleType : APDRuleType -> this.getRuleDecimalValue(ruleType), this.DecimalValue)
      case APDFieldType.TC_DATE :
        if (this.DateValue == null) return null
        var min = this.getRuleDateValue(APDRuleType.TC_MIN)
        if (min != null and this.DateValue < min) return DisplayKey.get("Web.Policy.ManualLine.MinimumDateRuleError", this.Attribute.ParentTypeForPMPropsMessages, this.Attribute.Label, min.ShortFormat.toString())
        var max = this.getRuleDateValue(APDRuleType.TC_MAX)
        if (max != null and this.DateValue > max) return DisplayKey.get("Web.Policy.ManualLine.MaximumDateRuleError", this.Attribute.ParentTypeForPMPropsMessages, this.Attribute.Label, max.ShortFormat.toString())
        break
      case APDFieldType.TC_INTEGER :
        return getMinMaxErrorMessageForInteger(\ruleType : APDRuleType -> this.getRuleIntegerValue(ruleType), this.IntegerValue)
      case APDFieldType.TC_TYPEKEY:
        if (this.Attribute.DropDownType == APDDropDownType.TC_OPTION) {
          var optionValue = this.CodeValue.Values?.first()
          if (optionValue != null) {
            switch (optionValue.DropdownColumn.ValueType) {
              case CovTermModelVal.TC_COUNT:
              case CovTermModelVal.TC_DAYS:
              case CovTermModelVal.TC_HOURS:
                return getMinMaxErrorMessageForInteger(\ruleType : APDRuleType -> this.getOptionIntegerValueEvaluatedFromRule(ruleType), optionValue.IntegerValue)
              case CovTermModelVal.TC_MONEY:
              case CovTermModelVal.TC_PERCENT:
              case CovTermModelVal.TC_OTHER:
                return getMinMaxErrorMessageForDecimal(\ruleType : APDRuleType -> this.getOptionDecimalValueEvaluatedFromRule(ruleType), optionValue.DecimalValue)
            }
          }
        }
        break
    }
    return null
  }

  private function getMinMaxErrorMessageForInteger(getNumericValue(ruleType : APDRuleType) : Integer, value : Integer) : String {
    if (value == null) {
      return null
    }
    var min = getNumericValue(APDRuleType.TC_MIN)
    if (min != null and value < min)
      return DisplayKey.get("Web.Policy.ManualLine.MinimumAmountRuleError", this.Attribute.ParentTypeForPMPropsMessages, this.Attribute.Label, min)
    var max = getNumericValue(APDRuleType.TC_MAX)
    if (max != null and value > max)
      return DisplayKey.get("Web.Policy.ManualLine.MaximumAmountRuleError", this.Attribute.ParentTypeForPMPropsMessages, this.Attribute.Label, max)

    return null
  }

  private function getMinMaxErrorMessageForDecimal(getNumericValue(ruleType : APDRuleType) : BigDecimal, value : BigDecimal) : String {
    if (value == null) {
      return null
    }
    var min = getNumericValue(APDRuleType.TC_MIN)
    if (min != null and value < min)
      return DisplayKey.get("Web.Policy.ManualLine.MinimumAmountRuleError", this.Attribute.ParentTypeForPMPropsMessages, this.Attribute.Label, min)
    var max = getNumericValue(APDRuleType.TC_MAX)
    if (max != null and value > max)
      return DisplayKey.get("Web.Policy.ManualLine.MaximumAmountRuleError", this.Attribute.ParentTypeForPMPropsMessages, this.Attribute.Label, max)

    return null
  }

  /**
   * Returns true if this data field should be visible in the UI, and false if it should be hidden.
   */
  property get VisibleInUI() : boolean {
    return APDDataExistenceType.TF_VISIBLEFIELDEXISTENCE.TypeKeys.contains(this.Availability)
  }
}
