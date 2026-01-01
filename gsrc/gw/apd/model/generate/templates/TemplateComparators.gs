package gw.apd.model.generate.templates

@Export
class TemplateComparators {

  /**
   * Only for comparing sibling attributes. E.g. Fields belonging to a specific coverable or terms belonging to a specific clause
   */
  static property get AttributeOrdering() : Comparator<APDAttribute> {
    var bySequence = Comparator.comparingInt<APDAttribute>(\attr -> attr.Sequence)
    var byName = Comparator.comparing<APDAttribute, String>(\attr -> attr.Name?:"")
    var byLabel = Comparator.comparing<APDAttribute, String>(\attr -> attr.Label?:"")
    return bySequence.thenComparing(byName).thenComparing(byLabel)
  }

  /**
   * For comparing sibling clauses or clauses across an entire line
   */
  static property get ClauseOrdering() : Comparator<APDClause> {
    var bySequence = Comparator.comparingInt<APDClause>(\clause -> clause.Sequence)
    var byCodeId = Comparator.comparing<APDClause, String>(\clause -> clause.CodeIdentifier?:"")
    var byName = Comparator.comparing<APDClause, String>(\clause -> clause.Name?:"")
    return bySequence.thenComparing(byCodeId).thenComparing(byName)
  }

  /**
   * For comparing siblings categories or categories across an entire line
   */
  static property get ClauseCategoryOrdering() : Comparator<APDClauseCategory> {
    var bySequence = Comparator.comparingInt<APDClauseCategory>(\category -> category.Sequence)
    var byCodeId = Comparator.comparing<APDClauseCategory, String>(\category -> category.CodeIdentifier?:"")
    var byName = Comparator.comparing<APDClauseCategory, String>(\category -> category.Name?:"")
    return bySequence.thenComparing(byCodeId).thenComparing(byName)
  }

  /**
   * For comparing siblings coverables or coverables across an entire line
   */
  static property get CoverableOrdering() : Comparator<APDCoverable> {
    var byTypeName = Comparator.comparing<APDCoverable, String>(\coverable -> coverable.TypeName?:"")
    var byName = Comparator.comparing<APDCoverable, String>(\coverable -> coverable.Name?:"")
    return byTypeName.thenComparing(byName)
  }

  /**
   * Only for comparing sibling dropdown entries. E.g. Dropdown entries belonging to a specific attribute or term
   */
  static property get DropdownEntryOrdering() : Comparator<APDDropdownEntry> {
    var bySequence = Comparator.comparing<APDDropdownEntry, Integer>(\entry -> entry.Sequence)
    var byCode = Comparator.comparing<APDDropdownEntry, String>(\entry -> entry.Code?:"")
    var byName = Comparator.comparing<APDDropdownEntry, String>(\entry -> entry.Name?:"")
    return bySequence.thenComparing(byCode).thenComparing(byName)
  }

  /**
   * Only for comparing sibling dropdown values. E.g. Dropdown values belonging to a specific dropdown entry
   */
  static property get DropdownValueOrdering() : Comparator<APDDropdownValue> {
    return Comparator.comparingInt<APDDropdownValue>(\value -> value.DropdownColumn.Sequence)
  }

  /**
   * For comparing siblings exposures or exposures across an entire line
   */
  static property get ExposureOrdering() : Comparator<APDExposure> {
    var byTypeName = Comparator.comparing<APDExposure, String>(\exp -> exp.TypeName?:"")
    var byName = Comparator.comparing<APDExposure, String>(\exp -> exp.Name?:"")
    return byTypeName.thenComparing(byName)
  }

  /**
   * Only for comparing sibling typekeys. E.g. Typekeys belonging to the same typelist
   */
  static property get TypekeyOrdering() : Comparator<gw.entity.TypeKey> {
    var byPriority = Comparator.comparingInt<gw.entity.TypeKey>(\typeKey -> typeKey.Priority)
    var byCode = Comparator.comparing<gw.entity.TypeKey, String>(\typeKey -> typeKey.Code?:"")
    return byPriority.thenComparing(byCode)
  }

  /**
   * For comparing any cost codes
   */
  static property get CostCodeOrdering() : Comparator<CostCode> {
    return Comparator.comparing<CostCode, String>(\cc -> cc.CostCode)
  }

  /**
   * Only for comparing sibling cost definitions. E.g. Cost definitions belonging to the same coverage or to the same coverable
   */
  static property get CostDefinitionOrdering() : Comparator<APDCostDefinition> {
    return Comparator.comparing<APDCostDefinition, CostCode>(\cd -> cd.CostCode, CostCodeOrdering)
  }
}