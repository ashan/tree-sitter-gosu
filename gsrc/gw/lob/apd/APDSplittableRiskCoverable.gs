package gw.lob.apd

@Export
class APDSplittableRiskCoverable extends APDVisualizeSplittableRisk {

  construct(owner: entity.APDRiskCoverable) {
    _owner = owner
  }

  override property get SplittableFieldsInternal() : APDDataField[] {
    return (_owner as APDRiskCoverable).RiskFields.where(\elt -> elt.Attribute.SplitByRatingPeriods)
  }
}