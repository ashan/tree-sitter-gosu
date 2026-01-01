package gw.lob.apd

@Export
abstract class APDVisualizeSplittableRisk extends APDSplittableRiskBase {

  override protected function splitRisk(date : Date) {
    super.splitRisk(date)
    SplittableFieldsInternal.each(\field -> {
      field.splitWM(date)
    })
  }

  override property get SplittableFields() : APDFieldAccessor[] {
    return SplittableFieldsInternal.Accessors
  }

  abstract protected property get SplittableFieldsInternal() : APDDataField[]
}