package nz.co.acc.edge.time

/**
 * Created by nitesh.gautam on 12-Jul-17.
 */
class LocalDateUtil_ACC {
  /**
   * Default time zone used by the server/platform.
   */
  private static final var DEFAULT_TIME_ZONE = TimeZone.getDefault()

  public static function toDTO(cal: Calendar): LocalDateDTO_ACC {
    if (cal == null) {
      return null
    }

    final var res = new LocalDateDTO_ACC()
    res.Year = cal.get(Calendar.YEAR)
    res.Month = cal.get(Calendar.MONTH) + 1
    res.Day = cal.get(Calendar.DAY_OF_MONTH)
    return res
  }

  public static function toDTO(dt: Date, tz: TimeZone): LocalDateDTO_ACC {
    if (dt == null) {
      return null
    }

    final var cal = new GregorianCalendar(tz)
    cal.setTime(dt)
    return toDTO(cal)
  }

  public static function toDTO(dt: Date): LocalDateDTO_ACC {
    return toDTO(dt, DEFAULT_TIME_ZONE)
  }

  public static function toMidnightDate(dto: LocalDateDTO_ACC, tz: TimeZone): Date {
    if (dto == null) {
      return null
    }

    final var cal = new GregorianCalendar(tz)
    cal.clear()
    cal.set(Calendar.YEAR, dto.Year)
    cal.set(Calendar.MONTH, dto.Month - 1)
    cal.set(Calendar.DAY_OF_MONTH, dto.Day)
    cal.set(Calendar.HOUR, 0)
    cal.set(Calendar.MINUTE, 1)
    cal.set(Calendar.SECOND, 0)
    cal.set(Calendar.MILLISECOND, 0)
    return cal.Time
  }

  public static function toMidnightDate(dto: LocalDateDTO_ACC): Date {
    return toMidnightDate(dto, DEFAULT_TIME_ZONE)
  }

  /**
   * Returns a number of days in a month denoted by the DTO. Day field of the DTO is ignored.
   * <dl>
   * <dt>Throws:</dt>
   * <dd><code>NullPointerException</code> - if dto is <code>null</code></dd>
   * </dl>
   *
   * @param dto local date (year and month) for which a number of days is requested. Day field is ignored.
   * @return number of days in <code>dto.month</code> month of the <code>dto.year</code> year.
   */
  public static function daysInLocalDate(dto: LocalDateDTO_ACC): int {
    final var cal = new GregorianCalendar()
    cal.clear()
    cal.set(Calendar.YEAR, dto.Year)
    cal.set(Calendar.MONTH, dto.Month - 1)
    return cal.getActualMaximum(Calendar.DAY_OF_MONTH)
  }
}