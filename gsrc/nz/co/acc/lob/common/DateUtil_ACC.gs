package nz.co.acc.lob.common

uses gw.api.util.DateUtil
uses gw.util.Pair
uses org.joda.time.Interval

uses java.math.BigDecimal
uses java.text.SimpleDateFormat
uses java.time.LocalDateTime
uses java.time.format.DateTimeFormatter

/**
 * Utility class to calculate ACC dates based on a year 1st April to 1st April the next year
 */
class DateUtil_ACC {

  private static var accStartDate = (ScriptParameters.getParameterValue("ACCStartDate") as Date)
  private static var accLevyYearStartDay = (ScriptParameters.getParameterValue("ACCLevyYearStartDay") as BigDecimal).intValue()
  private static var accLevyYearStartMonth = (ScriptParameters.getParameterValue("ACCLevyYearStartMonth") as BigDecimal).intValue()
  private static var accEarnersResidualLevyEndDate = (ScriptParameters.getParameterValue("ACCEarnersResidualLevyEndDate") as Date)
  private static var accWorkResidualLevyEndDate = (ScriptParameters.getParameterValue("ACCWorkResidualLevyEndDate") as Date)
  private static var accHealthAndSafetyLevyEndDate = (ScriptParameters.getParameterValue("ACCHealthAndSafetyEndDate") as Date)
  private static final var DEFAULT_DATE_FORMAT = new SimpleDateFormat("dd/MM/yyyy")
  private static final var ISO_DATE_TIME_FORMAT = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss")

  /**
   * Returns true if the date is prior to the ACC Start Date
   *
   * @param date
   * @return
   */
  public static function isDatePriorACCStartDate(date : Date) : boolean {
    return date.compareTo(accStartDate) < 0
  }

  /**
   * Returns true if the date is prior to the ACC Earners Residual Levy End Date
   *
   * @param date
   * @return
   */
  public static function isDatePriorACCEarnersResidualLevyEndDate(date : Date) : boolean {
    return date.compareTo(accEarnersResidualLevyEndDate) < 0
  }

  /**
   * Returns true if the date is prior to the ACC Work Residual Levy End Date
   *
   * @param date
   * @return
   */
  public static function isDatePriorACCWorkResidualLevyEndDate(date : Date) : boolean {
    return date.compareTo(accWorkResidualLevyEndDate) < 0
  }

  /**
   * Returns true if the date is prior to the ACC Health And Safety Levy End Date
   *
   * @param date
   * @return
   */
  public static function isDatePriorACCHealthAndSafetyEndDate(date : Date) : boolean {
    return date.before(accHealthAndSafetyLevyEndDate)
  }

  /**
   * Calculates the previous ACC Levy Year start date based on the input date
   *
   * @param inputDate
   * @return
   */
  public static function previousACCLevyYearStart(inputDate : Date) : Date {
    var inputYear = getPreviousACCYear(inputDate)
    return createDate(accLevyYearStartDay, accLevyYearStartMonth, inputYear)
  }

  /**
   * Calculates the next ACC Levy Year start date based on the input date
   *
   * @param inputDate
   * @return
   */
  public static function nextACCLevyYearStart(inputDate : Date) : Date {
    var inputYear = getLevyYear(inputDate)
    return createDate(accLevyYearStartDay, accLevyYearStartMonth, inputYear)
  }

  private static function getPreviousACCYear(inputDate : Date) : int {
    var inputYear = inputDate.YearOfDate
    var inputMonth = inputDate.MonthOfYear
    if (inputMonth < accLevyYearStartMonth) {
      inputYear = inputYear - 1
    }
    return inputYear
  }

  public static function getLevyYear(inputDate : Date) : int {
    var inputYear = inputDate.YearOfDate
    var inputMonth = inputDate.MonthOfYear
    if (inputMonth > (accLevyYearStartMonth - 1)) {
      inputYear = inputYear + 1
    }
    return inputYear
  }

  public static function getCurrentLevyYear() : int {
    return getLevyYear(DateUtil.currentDate())
  }

  /**
   * Checks the start ACC year for each date. If they match then they're in the same year.
   *
   * @param date1
   * @param date2
   * @return true if they're in the same year
   */
  public static function datesWithinSameACCYear(date1 : Date, date2 : Date) : boolean {
    var date1Start = getPreviousACCYear(date1)
    var date2Start = getPreviousACCYear(date2)
    return date1Start == date2Start
  }

  /**
   * Returns true if the input date is the ACC Levy Year start day and month (of any year).
   *
   * @param inputDate
   * @return
   */
  public static function isACCLevyYearStart(inputDate : Date) : boolean {
    var inputMonth = inputDate.MonthOfYear
    var inputDay = inputDate.DayOfMonth
    return inputMonth == accLevyYearStartMonth and inputDay == accLevyYearStartDay
  }

  /**
   * Creates a date base on the day, month, year. Time will be 00:00:00
   *
   * @param day
   * @param month
   * @param year
   * @return
   */
  public static function createDate(day : int, month : int, year : int) : Date {
    var cal = GregorianCalendar.Instance
    cal.set(Calendar.YEAR, year)
    cal.set(Calendar.MONTH, month - 1) // month is 0 based
    cal.set(Calendar.DAY_OF_MONTH, day)
    cal.set(Calendar.HOUR_OF_DAY, 0)
    cal.set(Calendar.MINUTE, 0)
    cal.set(Calendar.SECOND, 0)
    cal.set(Calendar.MILLISECOND, 0)
    return cal.getTime()
  }

  /**
   * Creates a date String based on the day, month, year. Time will be 00:00:00
   *
   * @param day
   * @param month
   * @param year
   * @param format
   * @return a String based on the format
   */
  public static function createDateAsString(day : int, month : int, year : int, format : String) : String {
    var date = createDate(day, month, year)
    var df = new SimpleDateFormat(format)
    df.setLenient(false)
    return df.format(date)
  }

  /**
   * Creates a date String based on a date.
   *
   * @param date
   * @return a String based on the format
   */
  public static function createDateAsString(date : Date) : String {
    DEFAULT_DATE_FORMAT.setLenient(false)
    return DEFAULT_DATE_FORMAT.format(date)
  }

  /**
   * Creates a ISO date/time String based on a date.
   *
   * @param date
   * @return ISO formatted date/time
   */
  public static function toISOString(date : Date) : String {
    if (date == null) {
      return null
    }
    ISO_DATE_TIME_FORMAT.setLenient(false)
    return ISO_DATE_TIME_FORMAT.format(date)
  }

  /**
   * Creates a date String based on a date.
   *
   * @param date
   * @param format
   * @return a String based on the format
   */
  public static function createDateAsString(date : Date, format : String) : String {
    var df = new SimpleDateFormat(format)
    df.setLenient(false)
    return df.format(date)
  }

  /**
   * Creates a date based on the String and format
   *
   * @param date
   * @param format
   * @return a Date based on the format
   */
  public static function createDateFromString(date : String, format : String) : Date {
    if (date != null) {
      var df = new SimpleDateFormat(format)
      df.setLenient(false)
      return df.parse(date)
    } else {
      return null
    }
  }

  public static function fromISOString(isoDateTime : String) : Date {
    var localDateTime = LocalDateTime.parse(isoDateTime, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
    return localDateTime.asDate()
  }

  /**
   * "Removes" the time component from a date i.e sets hour, minutes, seconds, milliseconds to 0
   *
   * @param date
   * @return
   */
  public static function removeTime(date : Date) : Date {
    var cal = GregorianCalendar.Instance
    cal.setTime(date)
    cal.set(Calendar.HOUR_OF_DAY, 0)
    cal.set(Calendar.MINUTE, 0)
    cal.set(Calendar.SECOND, 0)
    cal.set(Calendar.MILLISECOND, 0)
    return cal.getTime()
  }

  /**
   * Checks that the date is a specific day of the year
   *
   * @param date
   * @param dayOfMonth
   * @param monthOfYear
   * @return
   */
  public static function isSpecificDate(date : Date, dayOfMonth : int, monthOfYear : int) : boolean {
    return date.DayOfMonth == dayOfMonth and date.MonthOfYear == monthOfYear
  }

  public static function isStartBeforeEndDate(startDate : Date, endDate : Date) : boolean {
    return (startDate?.before(endDate))
  }

  /**
   * Checks that the list of date pairs do not overlap
   *
   * @param pairsOfDates list of date pairs
   * @return true if any pairs overlap
   */
  public static function isDatePairsOverlapping(pairsOfDates : List<Pair<Date, Date>>) : boolean {
    var intervalList = new ArrayList<Interval>()
    for (date in pairsOfDates) {
      intervalList.add(new Interval(date.First.Time, date.Second.Time))
    }
    return isOverlapping(intervalList)
  }

  private static function isOverlapping(intervals : List<Interval>) : boolean {
    //Requires that the intervals are sorted by start date.
    intervals.sortBy(\elt -> elt.Start)
    var i = 0
    var n : int = intervals.size()
    while (i < n - 1) {
      if (intervals.get(i).overlaps(intervals.get(i + 1))) {
        return true
      }
      i++
    }
    return false
  }

  /**
   * <p>Checks if the first date is before the second date ignoring time.</p>
   *
   * @param date1 the first date, not altered, not null
   * @param date2 the second date, not altered, not null
   * @return true if the first date day is before the second date day.
   * @throws IllegalArgumentException if the date is <code>null</code>
   */
  public static function isBeforeDay(date1 : Date, date2 : Date) : boolean {
    if (date1 == null || date2 == null) {
      throw new IllegalArgumentException("The dates must not be null");
    }
    var cal1 = Calendar.Instance;
    cal1.setTime(date1);
    var cal2 = Calendar.Instance;
    cal2.setTime(date2);
    return isBeforeDay(cal1, cal2);
  }

  /**
   * <p>Checks if the first date is before or on same day as the second date ignoring time.</p>
   *
   * @param date1 the first date, not altered, not null
   * @param date2 the second date, not altered, not null
   * @return true if the first date day is before or on the same day as the second date day.
   * @throws IllegalArgumentException if the date is <code>null</code>
   */
  public static function isBeforeOrOnSameDay(date1 : Date, date2 : Date) : boolean {
    if (date1 == null || date2 == null) {
      throw new IllegalArgumentException("The dates must not be null");
    }
    var cal1 = Calendar.Instance;
    cal1.setTime(date1);
    var cal2 = Calendar.Instance;
    cal2.setTime(date2);
    return isBeforeDay(cal1, cal2) or isSameDay(cal1, cal2);
  }

  /**
   * <p>Checks if the first calendar date is before the second calendar date ignoring time.</p>
   *
   * @param cal1 the first calendar, not altered, not null.
   * @param cal2 the second calendar, not altered, not null.
   * @return true if cal1 date is before cal2 date ignoring time.
   * @throws IllegalArgumentException if either of the calendars are <code>null</code>
   */
  public static function isBeforeDay(cal1 : Calendar, cal2 : Calendar) : boolean {
    if (cal1 == null || cal2 == null) {
      throw new IllegalArgumentException("The dates must not be null");
    }
    if (cal1.get(Calendar.ERA) < cal2.get(Calendar.ERA)) return true;
    if (cal1.get(Calendar.ERA) > cal2.get(Calendar.ERA)) return false;
    if (cal1.get(Calendar.YEAR) < cal2.get(Calendar.YEAR)) return true;
    if (cal1.get(Calendar.YEAR) > cal2.get(Calendar.YEAR)) return false;
    return cal1.get(Calendar.DAY_OF_YEAR) < cal2.get(Calendar.DAY_OF_YEAR);
  }

  /**
   * <p>Checks if two dates are on the same day ignoring time.</p>
   *
   * @param date1 the first date, not altered, not null
   * @param date2 the second date, not altered, not null
   * @return true if they represent the same day
   * @throws IllegalArgumentException if either date is <code>null</code>
   */
  public static function isSameDay(date1 : Date, date2 : Date) : boolean {
    if (date1 == null || date2 == null) {
      throw new IllegalArgumentException("The dates must not be null");
    }
    var cal1 = Calendar.getInstance();
    cal1.setTime(date1);
    var cal2 = Calendar.getInstance();
    cal2.setTime(date2);
    return isSameDay(cal1, cal2);
  }

  /**
   * <p>Checks if two calendars represent the same day ignoring time.</p>
   *
   * @param cal1 the first calendar, not altered, not null
   * @param cal2 the second calendar, not altered, not null
   * @return true if they represent the same day
   * @throws IllegalArgumentException if either calendar is <code>null</code>
   */
  public static function isSameDay(cal1 : Calendar, cal2 : Calendar) : boolean {
    if (cal1 == null || cal2 == null) {
      throw new IllegalArgumentException("The dates must not be null");
    }
    return (cal1.get(Calendar.ERA) == cal2.get(Calendar.ERA) &&
        cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
        cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR));
  }

  /**
   * <p>Checks if the first date is after the second date ignoring time.</p>
   *
   * @param date1 the first date, not altered, not null
   * @param date2 the second date, not altered, not null
   * @return true if the first date day is after the second date day.
   * @throws IllegalArgumentException if the date is <code>null</code>
   */
  public static function isAfterOrOnSameDay(date1 : Date, date2 : Date) : boolean {
    if (date1 == null || date2 == null) {
      throw new IllegalArgumentException("The dates must not be null");
    }
    var cal1 = Calendar.getInstance();
    cal1.setTime(date1);
    var cal2 = Calendar.getInstance();
    cal2.setTime(date2);
    return isAfterDay(cal1, cal2) or isSameDay(cal1, cal2);
  }

  /**
   * <p>Checks if the first date is after the second date ignoring time.</p>
   *
   * @param date1 the first date, not altered, not null
   * @param date2 the second date, not altered, not null
   * @return true if the first date day is after the second date day.
   * @throws IllegalArgumentException if the date is <code>null</code>
   */
  public static function isAfterDay(date1 : Date, date2 : Date) : boolean {
    if (date1 == null || date2 == null) {
      throw new IllegalArgumentException("The dates must not be null");
    }
    var cal1 = Calendar.getInstance();
    cal1.setTime(date1);
    var cal2 = Calendar.getInstance();
    cal2.setTime(date2);
    return isAfterDay(cal1, cal2);
  }

  /**
   * <p>Checks if the first calendar date is after the second calendar date ignoring time.</p>
   *
   * @param cal1 the first calendar, not altered, not null.
   * @param cal2 the second calendar, not altered, not null.
   * @return true if cal1 date is after cal2 date ignoring time.
   * @throws IllegalArgumentException if either of the calendars are <code>null</code>
   */
  public static function isAfterDay(cal1 : Calendar, cal2 : Calendar) : boolean {
    if (cal1 == null || cal2 == null) {
      throw new IllegalArgumentException("The dates must not be null");
    }
    if (cal1.get(Calendar.ERA) < cal2.get(Calendar.ERA)) return false;
    if (cal1.get(Calendar.ERA) > cal2.get(Calendar.ERA)) return true;
    if (cal1.get(Calendar.YEAR) < cal2.get(Calendar.YEAR)) return false;
    if (cal1.get(Calendar.YEAR) > cal2.get(Calendar.YEAR)) return true;
    return cal1.get(Calendar.DAY_OF_YEAR) > cal2.get(Calendar.DAY_OF_YEAR);
  }

  /**
   * <p>Checks if the inputDate is between the start and end dates or equal to either. It ignores the time component of the dates.</p>
   *
   * @param inputDate
   * @param startDate
   * @param endDate
   * @return true if the inputDate is between the start and end dates or equal to either.
   */
  public static function isBetweenOrEqualIgnoreTime(inputDate : Date, startDate : Date, endDate : Date) : boolean {
    if (inputDate == null or startDate == null or endDate == null) {
      return false
    }
    var isAfterOrEqualStart = false
    var isBeforeOrEqualEnd = false

    var trimmedInputDate = inputDate.trimToMidnight()
    isAfterOrEqualStart = trimmedInputDate.afterOrEqual(startDate.trimToMidnight())
    isBeforeOrEqualEnd = trimmedInputDate.beforeOrEqual(endDate.trimToMidnight())

    if (isAfterOrEqualStart and isBeforeOrEqualEnd) {
      return true
    }
    return false
  }

  public static function isFutureLevyYear(periodEndDate : Date) : boolean {
    return nextACCLevyYearStart(Date.CurrentDate).addMinutes(1).before(periodEndDate)
  }

  /**
   * Checks if the source date range @sourceRange is completely outside date range @targetRange
   * This is being used for very specific set of requirements around CPX-WPS policies
   *
   * @param sourceRange - date pair (start, end) that we need to check
   * @param targetRange - date pair (start, end) that
   * @return true if the source date range @sourceRange is completely outside date range @targetRange
   */
  public static function isDateRangeCompletelyOutside(sourceRange : Pair<Date, Date>, targetRange : Pair<Date, Date>) : boolean {
    var sourceStart = sourceRange.First.trimToMidnight()
    var sourceEnd = sourceRange.Second.trimToMidnight()
    var targetStart = targetRange.First.trimToMidnight()
    var targetEnd = targetRange.Second.trimToMidnight()

    if (sourceStart <= targetStart and sourceEnd <= targetStart or
        sourceStart >= targetEnd and sourceEnd >= targetEnd) {
      return true
    }
    return false
  }

  public static function createLevyYearStartDate(levyYear: Integer): Date {
    return createDate(1, 4, levyYear-1)
  }

  public static function currentDateToString() : String {
    var dtf = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");
    var now = LocalDateTime.now();
    return dtf.format(now)
  }

  public static function currentLevyYear(): Integer {
    return Date.Now.LevyYear_ACC
  }
}
