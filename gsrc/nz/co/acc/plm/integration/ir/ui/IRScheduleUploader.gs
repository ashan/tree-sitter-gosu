package nz.co.acc.plm.integration.ir.ui

uses gw.api.util.DisplayableException
uses gw.api.web.WebFile
uses gw.pl.util.csv.CSVParser
uses gw.util.GosuStringUtil
uses nz.co.acc.plm.integration.ir.schedule.IRScheduleException
uses nz.co.acc.plm.integration.ir.schedule.IRScheduleValidator
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

uses java.text.SimpleDateFormat

/**
 * IR schedule csv file uploader.
 * <p>
 * This class provides the helper functions to upload a csv file that contains the IR schedule.
 */
class IRScheduleUploader {

  // Names of the columns in the CSV file
  final static var COLUMN_RUNDATE = "Run Date"
  final static var COLUMN_LEVYYEAR = "Levy Year"
  final static var COLUMN_FEEDTYPE = "IR Feed Type"

  var _dateFormat = new SimpleDateFormat(ConstantPropertyHelper.DATE_FORMAT_yMd)

  /**
   * Import schedule in bulk
   *
   * @param aFile a CSV file
   */
  public function importFromCSV(aFile: WebFile) {
    var fn = "importFromCSV"

    if (aFile == null) {
      throw new DisplayableException("Please specify an IR schedule")
    }
    var parser = new CSVParser(aFile.InputStream)
    parser.nextLine() //Skipping header line
    var errMsg: String

    gw.transaction.Transaction.runWithNewBundle(\b -> {
      // We've read the first line already, hence start with 2.
      var i = 2
      while (parser.nextLine()) {
        try {
          createSchedule(parser)
        } catch (e: Exception) {
          errMsg = "Line ${i} : ${e.Message}"
          throw new DisplayableException(errMsg, e)
        }
        i++
      }
      var beans = b.getBeansByRootType(IRSchedule_ACC)
      if (beans?.HasElements) {
        var year = (beans.first() as IRSchedule_ACC).RunDate.Calendar.CalendarYear
        var validator = new IRScheduleValidator(year)
        validator.validateAndCommit(b)
      }
    })
  }

  /**
   * Creates a schedule entry
   *
   * @param parser instance of the csv parser
   */
  private function createSchedule(parser: CSVParser) {
    var sRunDate: String
    var sLevyYear: String
    var feedType: IRInboundFeedType_ACC
    var schedule = new IRSchedule_ACC()

    sRunDate = parser.nextString()
    if (sRunDate.NotBlank) {
      schedule.RunDate = _dateFormat.parse(sRunDate)
    } else {
      throw new IRScheduleException("${COLUMN_RUNDATE} is mandatory")
    }

    try {
      sLevyYear = parser.nextString()
      if (sLevyYear.NotBlank) {
        var levyYear = sLevyYear.toInt()
        if (sLevyYear.matches("^\\d{4}$")) {
          schedule.LevyYear = levyYear
        } else {
          throw new IRScheduleException("${COLUMN_LEVYYEAR} is not a valid year")
        }
      }
    } catch (nfe: NumberFormatException) {
      throw new IRScheduleException("Invalid ${COLUMN_LEVYYEAR}", nfe)
    }

    feedType = IRInboundFeedType_ACC.get(parser.nextString())
    if (feedType == null) {
      throw new IRScheduleException("Invalid ${COLUMN_FEEDTYPE}. Valid types are ${IRInboundFeedType_ACC.AllTypeKeys}")
    } else {
      schedule.IRInboundFeedType_ACC = feedType
    }

    if ((schedule.IRInboundFeedType_ACC != IRInboundFeedType_ACC.TC_REGISTRATIONS) && GosuStringUtil.isBlank(sLevyYear)) {
      throw new IRScheduleException("${COLUMN_LEVYYEAR} is mandatory for earnings feeds")
    }

  }
}