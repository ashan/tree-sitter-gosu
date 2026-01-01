package gw.rating.rtm.valueprovider

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.rating.rtm.domain.DatabasePopulator
uses gw.rating.rtm.domain.PersistenceAdapter
uses gw.rating.rtm.domain.table.RateTableCell
uses gw.rating.rtm.domain.table.RateTableModel
uses gw.rating.rtm.valueprovider.RateTableCellValueProvider
uses nz.co.acc.rating.util.RatingUtil_ACC

/**
 * <p>Retrieves all distinct valid values from the master classification unit table for the levy year (EndDate).</p>
 * <p>No arguments required</p>
 * <p>
 * Example: <code>gw.rating.rtm.valueprovider.ClassificationUnitValueProvider_ACC()</code> -
 * will retrieve all distinct valid values from <code>ClassificationUnitCode</code> column of
 * <code>ClassificationUnit_ACC</code> entity for the levy year (EndDate).
 * </p>
 */
class ClassificationUnitValueProvider_ACC extends RateTableCellValueProvider {
  private final var START_DATE_KEY = "StartDate"
  private final var END_DATE_KEY = "EndDate"
  private var _cache : Map<Date, Set<String>> = new HashMap<Date, Set<String>>()

  construct(column : RateTableColumn) {
    super(column)
  }

  /**
   * Returns a list of distinct values from a specific column of the source rate table.
   *
   * @see gw.rating.rtm.valueprovider.RateTableCellValueProvider#getValues(KeyableBean)
   */
  override function getValues(adapter : PersistenceAdapter) : String[] {
    return getValuesAsSet(adapter).toTypedArray()
  }

  override function containsCodeFor(cell : RateTableCell) : boolean {
    // Throw an exception if the CU cannot be found
    var cuFound = getValuesAsSet(cell.Adapter).contains(cell.Value as String)
    if (!cuFound) {
      var cuCode = cell.DisplayValue
      var startDt = cell.Adapter.getFieldValue(START_DATE_KEY) as Date
      var endDt = cell.Adapter.getFieldValue(END_DATE_KEY) as Date
      throw new DisplayableException(DisplayKey.get("Web.Rating_ACC.RateTables.ClassificationUnitNotFound", cuCode, startDt.ShortFormat, endDt.ShortFormat))
    }
    return cuFound
  }

  private function getValuesAsSet(adapter : PersistenceAdapter) : Set<String> {
    // Return the list of valid CU Codes for the year
    if (adapter == null) return  new TreeSet<String>()
    var startDate = adapter.getFieldValue(START_DATE_KEY) as Date
    var endDate = adapter.getFieldValue(END_DATE_KEY) as Date
    // use the end date as the cache key
    var cacheKey = endDate
    var values = _cache.get(cacheKey)
    if (values == null) {
      values = new TreeSet<String>()
      try {
        var classificationUnitsForLevyYear = RatingUtil_ACC.findClassificationUnitsForLevyYear(startDate, endDate)
        for (cu in classificationUnitsForLevyYear) {
          var cuCode = cu.ClassificationUnitCode
          values.add(cuCode)
        }
      } catch (e : Exception) {
        values = {}
      }
      _cache.put(cacheKey, values)
    }
    return values
  }

  /**
   * Returns <code>code</code> itself.
   * @see gw.rating.rtm.valueprovider.RateTableCellValueProvider#valueByCode(KeyableBean, String)
   */
  override function valueByCode(adapter : PersistenceAdapter, code : String) : String {
    return code
  }

  /**
   * Always return <code>false</code>.
   * @see gw.rating.rtm.valueprovider.RateTableCellValueProvider#HasCodedValue
   */
  override property get HasCodedValue() : boolean {
    return false
  }

  override function getValueMap(args : String[]) : Map<String, String> {
    return {}
  }

  override property get ArgumentsHelpText() : String {
    return DisplayKey.get("Web.Rating.RateTableDefinition.ValueProvider.HelpText.Default")
  }

}