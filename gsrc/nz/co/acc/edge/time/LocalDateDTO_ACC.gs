package nz.co.acc.edge.time

uses edge.aspects.validation.annotations.Range
uses edge.jsonmapper.JsonProperty
uses nz.co.acc.edge.time.annotation.DayOfMonth_ACC

/**
 * An improvement for LocalDateDTO to implement human-readable date format
 * Created by nitesh.gautam on 03-Aug-17.
 */
class LocalDateDTO_ACC {
  /**
   * ISO year.
   */
  @JsonProperty
  @Range(0, 5000)
  private var _year: int as Year

  @JsonProperty
  @Range(1, 12)
  private var _month: int as Month

  /**
   * Day of the month.
   */
  @JsonProperty
  @DayOfMonth_ACC
  private var _day: int as Day
}