package nz.co.acc.gwer.bulkupload.row

uses java.math.BigDecimal

/**
 * Created by HamblyAl on 18/03/2019.
 */
class ERCredibilityWeightingRow extends AbstractXLSRow {
  public var levyYear : Integer as LevyYear = null
  public var credibilityWeightingBand : Integer as CredibilityWeightingBand = null
  public var credibilityWtLowerLimit : Integer as CredibilityWtLowerLimit = null
  public var credibilityWtUpperLimit : Integer as CredibilityWtUpperLimit = null
  public var bandCredibilityWt : BigDecimal as BandCredibilityWt = null
  public var minLiableEarnings : BigDecimal as MinLiableEarnings = null
  public var maxLiableEarnings : BigDecimal as MaxLiableEarnings = null
  public var bandLiableEarnings : BigDecimal as BandLiableEarnings = null

  @Override
  function toString() : String  {
  return "ERCredibilityWeightingRow{" +
      "levyYear='" + levyYear + '\'' +
      ", bandMin='" + credibilityWeightingBand + '\'' +
      ", bandMax='" + credibilityWtLowerLimit + '\'' +
      ", step'" + credibilityWtUpperLimit + '\'' +
      ", bandMin='" + bandCredibilityWt + '\'' +
      ", bandMax='" + minLiableEarnings + '\'' +
      ", step'" + maxLiableEarnings + '\'' +
      ", bandMax='" + bandLiableEarnings + '\'' +
      '}';
  }
}