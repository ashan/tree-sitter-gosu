package nz.co.acc.sampledata

uses gw.api.database.Query
uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.lob.common.DateUtil_ACC
uses java.math.BigDecimal

/**
 * Load the ACC Earnings Min Max tables.
 */
class EarningsMinMaxData_ACC extends AbstractSampleDataCollection_ACC {

  final static var EARNINGS_MINMAX_USER = "EarningsMinMax"

  private static function earningsMinMaxCoverPlusLoaded(startDate: Date, endDate: Date): boolean {
    var earningsMinMaxCoverPlusQuery = Query.make(EarningsMinMaxData_ACC)
    earningsMinMaxCoverPlusQuery.compare(EarningsMinMaxData_ACC#PolicyStartDate, Equals, startDate)
    earningsMinMaxCoverPlusQuery.compare(EarningsMinMaxData_ACC#PolicyEndDate, Equals, endDate)
    return earningsMinMaxCoverPlusQuery.select().HasElements
  }

  private static function createLevyStartDate(year: int): Date {
    return DateUtil_ACC.createDate(1, 4, year)
  }

  private static function createLevyEndDate(year: int): Date {
    return DateUtil_ACC.createDate(31, 3, year)
  }

  private static function loadEarningsMinMax(startDate: Date, endDate: Date, minimumCP: MonetaryAmount, maximumCP: MonetaryAmount, minimumCPX: MonetaryAmount,
                                             maximumCPX: MonetaryAmount, finalMaximumWPS: MonetaryAmount, asUser: String): EarningsMinMaxData_ACC {
    var result: EarningsMinMaxData_ACC

    runTransactionAsUser(null, asUser, \b -> {
      var builder = new EarningsMinMaxDataBuilder_ACC()
          .withPolicyStartDate(startDate)
          .withPolicyEndDate(endDate)
          .withFullTimeMinimumCP(minimumCP)
          .withFullTimeMaximumCP(maximumCP)
          .withFullTimeMinimumCPX(minimumCPX)
          .withFullTimeMaximumCPX(maximumCPX)
          .withFinalMaximumWPS(finalMaximumWPS)

      result = builder.create(b)
    })

    return result
  }

  private static function loadEarningsMinMaxData() {
    loadEarningsMinMax(createLevyStartDate(2010), createLevyEndDate(2011),
        new MonetaryAmount(new BigDecimal(0.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(0.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(0.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(0.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(110018.00), Currency.TC_NZD), EARNINGS_MINMAX_USER)
    loadEarningsMinMax(createLevyStartDate(2011), createLevyEndDate(2012),
        new MonetaryAmount(new BigDecimal(26520.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(110018.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(26520.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(110018.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(111669.00), Currency.TC_NZD), EARNINGS_MINMAX_USER)
    loadEarningsMinMax(createLevyStartDate(2012), createLevyEndDate(2013),
        new MonetaryAmount(new BigDecimal(27040.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(111669.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(27040.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(111669.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(113768.00), Currency.TC_NZD), EARNINGS_MINMAX_USER)
    loadEarningsMinMax(createLevyStartDate(2013), createLevyEndDate(2014),
        new MonetaryAmount(new BigDecimal(28080.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(113768.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(28080.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(113768.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(116089.00), Currency.TC_NZD), EARNINGS_MINMAX_USER)
    loadEarningsMinMax(createLevyStartDate(2014), createLevyEndDate(2015),
        new MonetaryAmount(new BigDecimal(28600.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(116089.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(28600.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(116089.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(118191.00), Currency.TC_NZD), EARNINGS_MINMAX_USER)
    loadEarningsMinMax(createLevyStartDate(2015), createLevyEndDate(2016),
        new MonetaryAmount(new BigDecimal(29640.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(118191.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(29640.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(118191.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(120070.00), Currency.TC_NZD), EARNINGS_MINMAX_USER)
    loadEarningsMinMax(createLevyStartDate(2016), createLevyEndDate(2017),
        new MonetaryAmount(new BigDecimal(30680.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(120070.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(30680.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(120070.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(122063.00), Currency.TC_NZD), EARNINGS_MINMAX_USER)
    loadEarningsMinMax(createLevyStartDate(2017), createLevyEndDate(2018),
        new MonetaryAmount(new BigDecimal(31720.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(122063.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(25376.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(99242.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(654321.00), Currency.TC_NZD), EARNINGS_MINMAX_USER)
    loadEarningsMinMax(createLevyStartDate(2018), createLevyEndDate(2019),
        new MonetaryAmount(new BigDecimal(12345.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(654321.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(12345.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(654321.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(321321.00), Currency.TC_NZD), EARNINGS_MINMAX_USER)
    loadEarningsMinMax(createLevyStartDate(2019), createLevyEndDate(2020),
        new MonetaryAmount(new BigDecimal(2468.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(321321.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(2468.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(321321.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(987987.00), Currency.TC_NZD), EARNINGS_MINMAX_USER)
    loadEarningsMinMax(createLevyStartDate(2020), createLevyEndDate(2021),
        new MonetaryAmount(new BigDecimal(4567.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(987987.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(4567.00), Currency.TC_NZD), new MonetaryAmount(new BigDecimal(987987.00), Currency.TC_NZD),
        new MonetaryAmount(new BigDecimal(987987.00), Currency.TC_NZD), EARNINGS_MINMAX_USER)
  }

  override property get CollectionName(): String {
    return "ACC Earnings Min/Max Data"
  }

  override property get AlreadyLoaded(): boolean {
    return earningsMinMaxCoverPlusLoaded(createLevyStartDate(2016), createLevyEndDate(2017))
  }

  override function load() {
    loadEarningsMinMaxData()
  }
}