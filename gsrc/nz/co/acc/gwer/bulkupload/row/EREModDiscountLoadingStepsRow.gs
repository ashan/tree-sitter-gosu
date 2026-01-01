package nz.co.acc.gwer.bulkupload.row

/**
 * Created by HamblyAl on 18/03/2019.
 */
class EREModDiscountLoadingStepsRow extends AbstractXLSRow {
  public var levyYear : Integer as LevyYear = null
  public var bandMin : Integer as BandMin = null
  public var bandMax : Integer as BandMax = null
  public var step : Integer as Step = null

  @Override
  function toString() : String  {
  return "EREModDiscountLoadingSteps{" +
      "levyYear='" + levyYear + '\'' +
      ", bandMin='" + bandMin + '\'' +
      ", bandMax='" + bandMax + '\'' +
      ", step'" + step + '\'' +
      '}';
  }
}