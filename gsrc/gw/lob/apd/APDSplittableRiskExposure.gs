package gw.lob.apd

@Export
class APDSplittableRiskExposure extends APDVisualizeSplittableRisk {

  construct(owner: APDRiskExposure) {
    _owner = owner
  }

  override property get SplittableFieldsInternal() : APDDataField[] {
    return (_owner as APDRiskExposure).Fields.where(\elt -> elt.Attribute.SplitByRatingPeriods)
  }

}