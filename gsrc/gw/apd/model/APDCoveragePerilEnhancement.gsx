package gw.apd.model

uses gw.api.database.Query
uses entity.APDAttribute

/**
 * Agile Product Developer
 */
enhancement APDCoveragePerilEnhancement: APDCoveragePeril {

  property get AllPerils() : APDPeril[] {
    return Query.make(APDPeril).select().toTypedArray() // needs sorting by name
  }

  property get ConditionCandidates() : APDAttribute[] {
    final var attributes = new ArrayList<APDAttribute>()
    attributes.addAll(this.Coverage.Terms.where(\f -> f.Type == APDFieldType.TC_MONEY
          or f.Type == APDFieldType.TC_BIGDECIMAL
          or f.Type == APDFieldType.TC_INTEGER
          or f.Type == APDFieldType.TC_BOOLEAN
          or f.Type == APDFieldType.TC_TYPEKEY
    ).toList())
    attributes.addAll(this.Coverage.Coverable.Fields.where(\f -> f.Type == APDFieldType.TC_MONEY
        or f.Type == APDFieldType.TC_BIGDECIMAL
        or f.Type == APDFieldType.TC_INTEGER
        or f.Type == APDFieldType.TC_BOOLEAN
        or f.Type == APDFieldType.TC_TYPEKEY
    ).toList())

    return attributes.toTypedArray()
  }

  property get LimitCandidates() : APDAttribute[] {
    final var attributes = new ArrayList<APDAttribute>()
    attributes.addAll(this.Coverage.Terms.where(\f -> f.Type == APDFieldType.TC_MONEY).toList())
    attributes.addAll(this.Coverage.Coverable.Fields.where(\f -> f.Type == APDFieldType.TC_MONEY).toList())

    return attributes.toTypedArray()
  }

}
