package nz.co.acc.plm.integration.ir.inbound

uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper
uses org.apache.commons.lang3.builder.ToStringBuilder
uses org.apache.commons.lang3.builder.ToStringStyle

uses java.text.ParseException
uses java.text.SimpleDateFormat

/**
 * Created by samarak on 22/03/2017.
 */
class IRFeedDTO {
  var _runDate: Date as readonly RunDate
  var _feedType: IRInboundFeedType_ACC as readonly FeedType
  var _levyYear: Integer as readonly LevyYear

  /**
   * Constructs a DTO instance for IR Feed data. Parameters are taken in as Strings for validation purposes.
   *
   * @param runDate    run date as a String. Mandatory.
   * @param feedType   type of the feed. Mandatory.
   * @param levyYear   levy year the feed applies to. Null allowed.
   */
  construct(sRunDate: String, feedType: IRInboundFeedType_ACC, levyYear: Integer) {
    if (sRunDate == null) {
      throw new InvalidIRFeedDataException("RunDate is null")
    }

    try {
      var sdf = new SimpleDateFormat(ConstantPropertyHelper.DATE_FORMAT_yMd)
      this._runDate = sdf.parse(sRunDate)
    } catch (pe: ParseException) {
      throw new InvalidIRFeedDataException("Invalid RunDate: ${sRunDate}")
    }

    this._feedType = feedType
    if (this._feedType == null) {
      throw new InvalidIRFeedDataException("FeedType is null")
    }

    if (levyYear != null) {
      if (levyYear < 2000 || levyYear > 2099) {
        throw new InvalidIRFeedDataException("Invalid Levy Year: ${levyYear}")
      }
      this._levyYear = levyYear
    }
  }

  override function toString(): String {
    return new ToStringBuilder(this, ToStringStyle.SHORT_PREFIX_STYLE)
        .append("RunDate", RunDate)
        .append("FeedType", FeedType)
        .append("LevyYear", LevyYear)
        .toString()
  }
}
