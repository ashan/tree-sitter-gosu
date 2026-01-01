package gw.apd.model

@Export
enhancement APDAttributeContentEnhancement : APDAttribute {

  function getUIRuleMode(edition : APDProductLineEdition, rType : APDRuleType) : String {
    var rule = this.getEditionRule(edition, rType) as APDAttributeRule
    if (rule == null or rule.HasNoDefault) return "none"
    if (this.SupportsCalculatedValue and rule.DefaultCalculatedValue != null) return "calculated"
    return this.Type.Code
  }

  /**
   * Returns the correct mode for displaying values of this attribute in the UI. This is based on the type of the
   * attribute and whether it is scalable.
   */
  property get CellMode() : String {
    var prefix = (this.Scalable) ? ScalableCellModePrefix : ""
    return prefix + this.Type.Code
  }

  /**
   * Returns a prefix to use in UI cell mode names for scalable values.
   */
  static property get ScalableCellModePrefix() : String {
    return "scalable"
  }

  property get FunctionArgumentCandidates() : APDAttribute[] {
    if (this typeis APDTerm) {
      return this.Clause.Descendants*.Terms.where(\term -> haveSameType(this, term))
    }
    return {}
  }

  private function haveSameType(term1 : APDTerm, term2 : APDTerm) : boolean {
    if (term1.Type == APDFieldType.TC_TYPEKEY) {
      // both terms are option terms and have the same drop-down column ValueType
      // (for Option drop-down type there is only one drop-down column)
      return
          term1.IsOptionTerm and
          term2.IsOptionTerm and
          haveSameValueType(term1, term2)
    }
    return term1.Type == term2.Type
  }

  private function haveSameValueType(term1 : APDTerm, term2 : APDTerm) : boolean {
    var valueType1 = term1.DropdownColumns.first().ValueType
    var valueType2 = term2.DropdownColumns.first().ValueType
    return valueType1 != null and
        valueType2 != null and
        valueType1 == valueType2
  }

}