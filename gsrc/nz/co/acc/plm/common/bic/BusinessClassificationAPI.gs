package nz.co.acc.plm.common.bic

uses entity.BusinessIndustryCode_ACC
uses entity.ClassificationUnit_ACC
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.util.GosuStringUtil

uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.time.LocalDate
uses java.time.Month
uses java.time.ZoneId
uses java.util.regex.Pattern

/**
 * API for Business Industry Classification (BIC) code search operations.
 * <p>
 * Created by fabianr on 5/05/2017.
 */
class BusinessClassificationAPI {
  private static final var _log = StructuredLogger.INTEGRATION.withClass(BusinessClassificationAPI)
  private static final var LEVY_MONTH = Month.APRIL
  private static final var _ruralBicAddressPattern = Pattern.compile(ConfigurationProperty.BUSINESS_CLASSIFICATION_CODE_ADDRESS_PATTERN.PropertyValue)
  private var _agriculturalServices : String
  private var _manufacturingServices : String

  construct() {
    this._agriculturalServices = ScriptParameters.BICCodeRuralDefault_ACC
    this._manufacturingServices = ScriptParameters.BICCodeNonRuralDefault_ACC
  }

  public function getBICCodeAvailableYears(bicCode:String, startYear : int, endYear: int) : BusinessIndustryCode_ACC[] {
    if (bicCode == null || bicCode.trim().isEmpty()) {
      return null
    }

    var startDate = DateUtil_ACC.createDate(1, 4, startYear)
    var endDate = DateUtil_ACC.createDate(1, 4, endYear)
    var results = Query.make(BusinessIndustryCode_ACC)
        .compare(BusinessIndustryCode_ACC#BusinessIndustryCode, Relop.Equals, bicCode)
        .compare(BusinessIndustryCode_ACC#EndDate, Relop.GreaterThanOrEquals, startDate)
        .compare(BusinessIndustryCode_ACC#EndDate, Relop.LessThanOrEquals, endDate)
        .select()
    return results.toTypedArray()
  }

  /**
   * Returns a Business Industry Classification (BIC) code for a given Nature of Business (NoB) string and Levey Year.
   * The search will filter in any record where their BIC Description starts with value specified via {@code natureOfBusiness}.
   * If there are multiple records in the results, this function will return the first BIC record.
   * <p>
   * NTK-83 NowchoO updating code to use BusinessIndustryCode instead of BusinessIndustryDescription
   *
   * @param natureOfBusiness Nature of Business string. BIC Code
   * @param levyYear         For which levy year
   * @return The BIC code that matches the given NoB(BIC) and Levy Year.
   */
  public function getBICCode(natureOfBusiness : String, levyYear : Integer) : BusinessIndustryCode_ACC {
    if (_log.DebugEnabled) {
      _log.debug("getBICCode '${natureOfBusiness}', ${levyYear}")
    }
    var levyPeriod = new LevyPeriod(levyYear)
    if (natureOfBusiness == null || natureOfBusiness.trim().isEmpty()) {
      return null
    }
    natureOfBusiness = natureOfBusiness.trim()

    var results = Query.make(BusinessIndustryCode_ACC)
        //NTK-83 NowchoO updating code to use BusinessIndustryCode instead of BusinessIndustryDescription
        .compare(BusinessIndustryCode_ACC#BusinessIndustryCode, Relop.Equals, natureOfBusiness)
        .compare(BusinessIndustryCode_ACC#StartDate, Relop.GreaterThanOrEquals, levyPeriod.StartDate)
        .compare(BusinessIndustryCode_ACC#EndDate, Relop.LessThanOrEquals, levyPeriod.EndDate)
        .select()
    var first = results.FirstResult

    if (_log.DebugEnabled) {
      _log.debug("getBICCode found ${results.Count} results. Returning bicCode=${first?.BusinessIndustryCode}, bicDescription=${first?.BusinessIndustryDescription}")
    }

    return first
  }

  /**
   * Returns a Business Industry Classification (BIC) code for a given Nature of Business (NoB) string and Levey Year.
   * The search will filter in any record where their BIC Description starts with value specified via {@code natureOfBusiness}.
   * If there are multiple records in the results, this function will return the first BIC record.
   * <p>
   * NTK-83 NowchoO updating code to use BusinessIndustryCode instead of BusinessIndustryDescription
   *
   * @param natureOfBusiness Nature of Business string. BIC Code
   * @param levyYear         For which levy year
   * @return The BIC code that matches the given NoB(BIC) and Levy Year.
   */
  public function getCUCode(cuCode : String, levyYear : Integer) : ClassificationUnit_ACC {
    if (_log.DebugEnabled) {
      _log.debug("getCUCode ${cuCode}, ${levyYear}")
    }
    var levyPeriod = new LevyPeriod(levyYear)
    if (cuCode == null || cuCode.trim().isEmpty()) {
      return null
    }
    cuCode = cuCode.trim()

    var results = Query.make(ClassificationUnit_ACC)
        //NTK-83 NowchoO updating code to use BusinessIndustryCode instead of BusinessIndustryDescription
        .compare(ClassificationUnit_ACC#ClassificationUnitCode, Relop.Equals, cuCode)
        .compare(ClassificationUnit_ACC#StartDate, Relop.GreaterThanOrEquals, levyPeriod.StartDate)
        .compare(ClassificationUnit_ACC#EndDate, Relop.LessThanOrEquals, levyPeriod.EndDate)
        .select()
    var first = results.FirstResult

    if (_log.DebugEnabled) {
      _log.debug("getCUCode found ${results.Count} results. Returning bicCode=${first?.ClassificationUnitCode}, bicDescription=${first?.ClassificationUnitDescription}")
    }
    return first
  }

  public function getBICCodeFromAddress(address : String, levyYear : Integer) : BusinessIndustryCode_ACC {
    if (this.isRuralAddress(address)) {
      return getBICCode(this._agriculturalServices, levyYear)
    } else {
      return getBICCode(this._manufacturingServices, levyYear)
    }
  }

  private class LevyPeriod {
    private var _startDate : Date as StartDate
    private var _endDate : Date as EndDate

    construct(levyYear : Integer) {
      //TODO use DateUtils to derive these dates.
      this._startDate = Date.from(LocalDate.of(levyYear, LEVY_MONTH, 1).minusYears(1).atStartOfDay(ZoneId.systemDefault()).toInstant())
      this._endDate = Date.from(LocalDate.of(levyYear, LEVY_MONTH, 1).atStartOfDay(ZoneId.systemDefault()).toInstant())
    }
  }

  private function isRuralAddress(address : String) : boolean {
    address = address.concat(" ") // TODO: Apparenty the regex needs a trailing space.
    var matcher = _ruralBicAddressPattern.matcher(address)
    return matcher.find()
  }

  /**
   * Creating this function for lookup using prevNOB, since currently descriptions will be stored.
   * With time this will not return anything and lookup getBICCode will effectively return bicCodes
   *
   * @param natureOfBusiness
   * @param levyYear
   * @return
   */
  public function getBICCodeFromDescription(natureOfBusinessDescription : String, levyYear : Integer) : BusinessIndustryCode_ACC {
    if (_log.DebugEnabled) {
      _log.debug("getBICCodeFromDescription '${natureOfBusinessDescription}', ${levyYear}")
    }
    var levyPeriod = new LevyPeriod(levyYear)
    if (GosuStringUtil.isBlank(natureOfBusinessDescription)) {
      return null
    }
    natureOfBusinessDescription = natureOfBusinessDescription.trim()

    var results = Query.make(BusinessIndustryCode_ACC)
        .compare(BusinessIndustryCode_ACC#BusinessIndustryDescription, Relop.Equals, natureOfBusinessDescription)
        .compare(BusinessIndustryCode_ACC#StartDate, Relop.GreaterThanOrEquals, levyPeriod.StartDate)
        .compare(BusinessIndustryCode_ACC#EndDate, Relop.LessThanOrEquals, levyPeriod.EndDate)
        .select()
    var first = results.FirstResult

    if (first == null) {
      if (natureOfBusinessDescription.length() > 50) {
        natureOfBusinessDescription = natureOfBusinessDescription.substring(0, 49)
      }
      results = Query.make(BusinessIndustryCode_ACC)
          .startsWith(BusinessIndustryCode_ACC#BusinessIndustryDescription, natureOfBusinessDescription, true)
          .compare(BusinessIndustryCode_ACC#StartDate, Relop.GreaterThanOrEquals, levyPeriod.StartDate)
          .compare(BusinessIndustryCode_ACC#EndDate, Relop.LessThanOrEquals, levyPeriod.EndDate)
          .select()
      first = results.FirstResult
    }
    if(_log.DebugEnabled){
      _log.debug("getBICCodeFromDescription found ${results.Count} results. Returning bicCode=${first?.BusinessIndustryCode}, bicDescription=${first?.BusinessIndustryDescription}")
    }
    return first
  }
}
