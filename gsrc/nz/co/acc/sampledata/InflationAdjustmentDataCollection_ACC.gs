package nz.co.acc.sampledata

uses gw.api.database.Query
uses nz.co.acc.lob.common.DateUtil_ACC

uses java.math.BigDecimal

/**
 * Load the ACC Inflation Adjustment tables.
 */
class InflationAdjustmentDataCollection_ACC extends AbstractSampleDataCollection_ACC {

  override property get CollectionName(): String {
    return "ACC Inflation Adjustment Data"
  }

  override property get AlreadyLoaded(): boolean {
    return InflationAdjustmentDataLoaded(createLevyStartDate(2016), createLevyEndDate(2017))
  }

  private static function InflationAdjustmentDataLoaded(startDate: Date, endDate: Date): boolean {
    var InflationAdjustmentQuery = Query.make(InflationAdjustment_ACC)
    InflationAdjustmentQuery.compare(InflationAdjustment_ACC#PolicyStartDate, Equals, startDate)
    InflationAdjustmentQuery.compare(InflationAdjustment_ACC#PolicyEndDate, Equals, endDate)
    return InflationAdjustmentQuery.select().HasElements
  }

  private static function createLevyStartDate(year : int) : Date {
    return DateUtil_ACC.createDate(1, 4, year)
  }

  private static function createLevyEndDate(year : int) : Date {
    return DateUtil_ACC.createDate(31, 3, year)
  }

  private static function loadInflationAdjustment(startDate: Date, endDate: Date, ratePercent: BigDecimal): InflationAdjustment_ACC {
    var result: InflationAdjustment_ACC

    runTransactionAsUser(null, "InflationAdjustment", \b -> {
      var builder = new InflationAdjustmentBuilder_ACC()
          .withPolicyStartDate(startDate)
          .withPolicyEndDate(endDate)
          .withRatePercent(ratePercent)

      result = builder.create(b)
    })

    return result
  }

  private static function loadInflationAdjustments() {
    loadInflationAdjustment(createLevyStartDate(2020), createLevyEndDate(2021), new BigDecimal("99.99"))
    loadInflationAdjustment(createLevyStartDate(2019), createLevyEndDate(2020), new BigDecimal("-0.23"))
    loadInflationAdjustment(createLevyStartDate(2018), createLevyEndDate(2019), new BigDecimal("0.00"))
    loadInflationAdjustment(createLevyStartDate(2017), createLevyEndDate(2018), new BigDecimal("53.46"))
    loadInflationAdjustment(createLevyStartDate(2016), createLevyEndDate(2017), new BigDecimal("1.80"))
    loadInflationAdjustment(createLevyStartDate(2015), createLevyEndDate(2016), new BigDecimal("2.30"))
    loadInflationAdjustment(createLevyStartDate(2014), createLevyEndDate(2015), new BigDecimal("3.69"))
    loadInflationAdjustment(createLevyStartDate(2013), createLevyEndDate(2014), new BigDecimal("2.40"))
    loadInflationAdjustment(createLevyStartDate(2012), createLevyEndDate(2013), new BigDecimal("2.70"))
    loadInflationAdjustment(createLevyStartDate(2011), createLevyEndDate(2012), new BigDecimal("2.60"))
    loadInflationAdjustment(createLevyStartDate(2010), createLevyEndDate(2011), new BigDecimal("2.00"))
    loadInflationAdjustment(createLevyStartDate(2009), createLevyEndDate(2010), new BigDecimal("2.50"))
  }

  override function load() {
    loadInflationAdjustments()
  }
}