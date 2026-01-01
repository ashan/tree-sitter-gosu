package nz.co.acc.sampledata

uses gw.api.database.Query
uses gw.api.financials.CurrencyAmount
uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.lob.common.DateUtil_ACC
uses entity.ClassificationUnit_ACC
uses entity.BusinessIndustryCode_ACC

uses java.math.BigDecimal

/**
 * Load the ACC Business Industry Codes and Classification Unit Codes.
 */
class BIC_CU_Data_ACC extends AbstractSampleDataCollection_ACC {
  private static final var CLASSIFICATION_UNIT_PUBLIC_ID_PREFIX : String = "pc:"
  private static var classificationUnitPublicIdIndex : int = 0

  construct() {
  }

  public override property get CollectionName() : String {
    return "ACC Business Industry and Classification Unit Code Data"
  }

  public override property get AlreadyLoaded() : boolean {
    return classificationUnitCodeLoaded("25610")
  }

  private static function classificationUnitCodeLoaded(classificationUnitCode : String) : boolean {
    var classificationUnitCodeQuery = Query.make(ClassificationUnit_ACC).compare(ClassificationUnit_ACC#ClassificationUnitCode, Equals, classificationUnitCode)
    return classificationUnitCodeQuery.select().HasElements
  }

  private static function createLevyDate(year : int) : Date {
    return DateUtil_ACC.createDate(1, 4, year)
  }

  protected static function findClassificationUnit(classificationUnitCode : String, startDate : Date, endDate : Date) : ClassificationUnit_ACC {
    var query = Query.make(ClassificationUnit_ACC)
    query.compare(ClassificationUnit_ACC#ClassificationUnitCode, Equals, classificationUnitCode)
    query.compare(ClassificationUnit_ACC#StartDate, Equals, startDate)
    query.compare(ClassificationUnit_ACC#EndDate, Equals, endDate)
    var result = query.select().AtMostOneRow
    return result
  }

  private function loadClassificationUnits(
      classificationUnitCode : String,
      classificationUnitDescription : String,
      startYear : Integer,
      endYear : Integer) {

    for (year in startYear..endYear) {
      var startDate = DateUtil_ACC.createDate(1, 4, year - 1)
      var endDate = DateUtil_ACC.createDate(1, 4, year)
      var publicID = generatePublicId()
      loadClassificationUnit(publicID, classificationUnitCode, classificationUnitDescription, startDate, endDate)
    }
  }

  private static function loadClassificationUnit(
      publicId : String,
      classificationUnitCode : String,
      classificationUnitDescription : String,
      startDate : Date,
      endDate : Date) : ClassificationUnit_ACC {
    var result : ClassificationUnit_ACC

    runTransactionAsUser(null, "ClassificationUnit " + classificationUnitCode, \b -> {
      var builder = new ClassificationUnitBuilder_ACC()
          .withPublicId(publicId)
          .withClassificationUnitCode(classificationUnitCode)
          .withClassificationUnitDescription(classificationUnitDescription)
          .withReplacementLabourCost(new MonetaryAmount(BigDecimal.valueOf(Double.valueOf(classificationUnitCode)).doubleValue() * 4, Currency.TC_NZD))
          .withStartDate(startDate)
          .withEndDate(endDate)


      result = builder.create(b)
    })

    return result
  }

  private static function loadBusinessIndustryCodes(
      classificationUnitCode : String,
      businessIndustryCode : String,
      businessIndustryDescription : String,
      startYear : Integer,
      endYear : Integer) {

    for (year in startYear..endYear) {
      var startDate = DateUtil_ACC.createDate(1, 4, year - 1)
      var endDate = DateUtil_ACC.createDate(1, 4, year)
      loadBusinessIndustryCode(classificationUnitCode,
          businessIndustryCode,
          businessIndustryDescription,
          startDate,
          endDate)
    }
  }

  private static function loadBusinessIndustryCode(
      classificationUnitCode : String,
      businessIndustryCode : String,
      businessIndustryDescription : String,
      startDate : Date,
      endDate : Date) : BusinessIndustryCode_ACC {
    var result : BusinessIndustryCode_ACC

    runTransactionAsUser(null, "BusinessIndustryCode " + businessIndustryCode, \b -> {
      var classificationUnit = findClassificationUnit(classificationUnitCode, startDate, endDate)
      var builder = new BusinessIndustryCodeBuilder_ACC()
          .withBusinessIndustryCode(businessIndustryCode)
          .withBusinessIndustryDescription(businessIndustryDescription)
          .withStartDate(startDate)
          .withEndDate(endDate)
          .withClassificationUnit(classificationUnit)

      result = builder.create(b)
    })

    return result
  }

  public override function load() {
    loadClassificationUnits()
    loadBusinessIndustryCodes()
  }

  private function generatePublicId() : String {
    classificationUnitPublicIdIndex = classificationUnitPublicIdIndex + 1
    return CLASSIFICATION_UNIT_PUBLIC_ID_PREFIX + classificationUnitPublicIdIndex
  }

  private function loadClassificationUnits() {
    var cus = {
        {"78550", "Management advice and related consulting services"},
        {"4190", "Fishing (not elsewhere classified)"},
        {"51250", "Takeaway Food Services"},
        {"25610", "Rigid and semi-rigid polymer product manufacturing"},
        {"1110", "Nursery production"},
        {"1111", "Turf growing"},
        {"1120", "Floriculture production"},
        {"1692", "Mushroom growing"},
        {"1130", "Vegetable growing"},
        {"1140", "Grape growing"},
        {"1170", "Kiwifruit growing"},
        {"1192", "Berry fruit growing"},
        {"1150", "Apple and pear growing"},
        {"1160", "Stone fruit growing"},
        {"1180", "Olive growing"},
        {"1190", "Fruit and tree nut growing (not elsewhere classified)"},
        {"1191", "Citrus fruit growing"},
        {"1210", "Grain growing"},
        {"1220", "Grain and sheep or grain and beef cattle farming"},
        {"1230", "Sheep and beef cattle farming"},
        {"1240", "Sheep farming"},
        {"1250", "Beef cattle farming"},
        {"1300", "Dairy cattle farming"},
        {"1410", "Poultry farming (meat)"},
        {"1420", "Poultry farming (eggs)"},
        {"1510", "Pig farming"},
        {"1520", "Horse farming and horse agistment"},
        {"1530", "Deer farming"},
        {"1590", "Livestock farming (not elsewhere classified)"},
        {"1593", " Beekeeping"},
        {"1593", "Beekeeping"},
        {"1690", "Crop growing (not elsewhere classified)"},
        {"23290", "Wood Product Manufacturing (not elsewhere classified)"},
        {"25590", "Plumbing Services"},
        {"3010", "Forestry"},
        {"3020", "Logging"},
        {"3021", "Forest product and moss gathering and processing"},
        {"4110", "Rock lobster and crab fishing or potting"},
        {"4120", "Prawn fishing"},
        {"4130", "Fish trawling, seining, and netting (including processing on board)"},
        {"4150", "Line fishing (including processing on board)"},
        {"4210", "Offshore aquaculture"},
        {"4220", "Onshore aquaculture"},
        {"42310", "Plumbing Services"},
        {"64050", "Air operations under Civil Aviation Rules Parts 101, 103, 104, 105, and 106"},
        {"96290", "Interest Group Services (not elsewhere classified)"}
    }

    for (cu in cus) {
      loadClassificationUnits(cu.first(), cu.last(), 2010, Date.Now.LevyYear_ACC + 1)
    }

  }

  private function loadBusinessIndustryCodes() {
    var bics = {
        {"1110", "A011110", "Ornamental plant growing"},
        {"1110", "A011111", "Ornamental plant growing2"},
        {"1111", "A011310", "Turf growing"},
        {"1120", "A011410", "Flower growing"},
        {"1130", "A012210", "Herb growing"},
        {"1140", "A013110", "Grape growing"},
        {"1150", "A013410", "Apple growing"},
        {"1160", "A013510", "Stone fruit growing"},
        {"1170", "A013210", "Kiwifruit growing"},
        {"1180", "A013710", "Olive growing"},
        {"1190", "A013910", "Almond growing"},
        {"1191", "A013610", "Citrus fruit growing"},
        {"1192", "A013310", "Berryfruit growing"},
        {"1210", "A014910", "Cereal grain growing"},
        {"1220", "A014510", "Beef cattle farming and cereal grain growing"},
        {"1230", "A014410", "Beef cattle and sheep farming"},
        {"1240", "A014110", "Sheep farming"},
        {"1240", "A052920", "Agricultural services nec"},
        {"1250", "A014210", "Agistment service - other than horses"},
        {"1300", "A016010", "Dairy cattle farming"},
        {"1410", "A017110", "Chicken farming – for meat"},
        {"1420", "A017210", "Egg farm operation"},
        {"1510", "A019210", "Pig farming"},
        {"1520", "A019110", "Agistment service - horses"},
        {"1530", "A018010", "Deer breeding, farming"},
        {"1590", "A019910", "Bird breeding – except poultry or game birds"},
        {"1593", "A019310", "Apiarist"},
        {"1690", "A015905", "Crop growing nec"},
        {"1692", "A012110", "Mushroom growing "},
        {"23290", "C149910", "Barrel mfg - wooden"},
        {"23290", "C149920", "Containers (wooden) mfg"},
        {"23290", "C149930", "Frame mfg - wooden picture or mirror"},
        {"23290", "C149940", "Hot tub (wooden) mfg"},
        {"23290", "C149950", "Picture framing service"},
        {"23290", "C149960", "Wood product mfg nec"},
        {"23290", "C251910", "Cane product mfg"},
        {"23290", "C259907", "Manufacturing nec"},
        {"25590", "C192010", "Business consultant service"},
        {"25610", "C191250", "Plastic door or window mfg"},
        {"25610", "C191260", "Plastic extruded product mfg"},
        {"3010", "A030120", "Forestry"},
        {"3020", "A030210", "Firewood cutting – forest"},
        {"3021", "A030110", "Forest product gathering"},
        {"4110", "A041105", "Crab catching"},
        {"4120", "A041210", "Prawn fishing"},
        {"4130", "A041403", "Netting for finfish (including processing on board)"},
        {"4150", "A041310", "Fishing – line fishing (including processing on board)"},
        {"4190", "A041910", "Abalone fishing"},
        {"4210", "A020110", "Aquaculture (offshore)"},
        {"4220", "A020310", "Crayfish breeding and farming"},
        {"42310", "E323110", "Drainlaying (construction) including cleaning or repairing - except sewerage or stormwater drainage networks"},
        {"42310", "E323120", "Gas plumbing"},
        {"42310", "E323130", "Guttering installation or repair - roof"},
        {"42310", "E323140", "Hot water system installation"},
        {"42310", "E323150", "Plumbing - except marine"},
        {"42310", "E323160", "Septic tank installation"},
        {"42310", "E323170", "Solar hot water system installation"},
        {"51250", "H451240", "Pizza takeaway - retailing"},
        {"64050", "I490002", "Air operations under CAA Rules parts 101, 103 and 104"},
        {"64050", "I501017", "Hang glider operation"},
        {"64050", "I501035", "Hot air ballooning operation"},
        {"64050", "I501043", "Parachuting and sky-diving operations"},
        {"64050", "I501055", "Air operations under CAA Rules part 115"},
        {"78550", "M696205", "Business consultant service"},
        {"96290", "S955920", "Automobile association operation"},
        {"96290", "S955930", "Club - not licensed, for promotion of community or sectional interest nec"},
        {"96290", "S955950", "Consumers association operation"},
        {"96290", "S955960", "Interest group nec"},
        {"96290", "S955970", "Political party operation"},
        {"96290", "S955980", "Society operation (for the promotion of community or sectional interest) nec"},
        {"96290", "S955990", "Welfare fund raising"}
    }
    for (bic in bics) {
      loadBusinessIndustryCodes(bic[0], bic[1], bic[2], 2010, Date.Now.LevyYear_ACC + 1)
    }
  }
}