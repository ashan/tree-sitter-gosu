package nz.co.acc.edge.capabilities.policy.lob.cp.dto

uses edge.jsonmapper.JsonProperty
uses nz.co.acc.common.integration.bulkupload.fieldparser.LevyYearParser

uses java.math.BigDecimal

/**
 * Created by manubaf on 11/11/2020.
 */
class HistoricalEarnings_ACC {
  @JsonProperty
  var _earnings : BigDecimal as Earnings

  @JsonProperty
  var _levyYear : Integer as LevyYear

  construct(earnings:BigDecimal, levyYear : Integer) {
    _earnings = earnings
    _levyYear = levyYear
  }
}