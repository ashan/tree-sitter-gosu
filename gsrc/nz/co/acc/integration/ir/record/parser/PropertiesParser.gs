package nz.co.acc.integration.ir.record.parser

uses edge.util.either.Either
uses gw.util.GosuStringUtil
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

uses java.io.StringReader
uses java.math.BigDecimal
uses java.text.SimpleDateFormat

/**
 * Created by Mike Ourednik on 17/08/2019.
 */
class PropertiesParser {

  private var props = new Properties()
  private var _parserResults : LinkedList<PropertiesParserResult> as readonly ParseResults = {}
  private var dateFormat = new SimpleDateFormat(ConstantPropertyHelper.DATE_FORMAT_yMd)

  public construct(payload : String) {
    props.load(new StringReader(payload))
  }

  public function getString(propertyKey : String) : Either<String, String> {
    var parserFunction = \propertyValue : String -> Either.right<String, String>(propertyValue)
    return doParse(propertyKey, parserFunction)
  }

  public function getStringMandatory(propertyKey : String) : Either<String, String> {
    var parserFunction = \propertyValue : String -> {
      if (propertyValue == null or propertyValue.isEmpty()) {
        return Either.left<String, String>("value is null/empty")
      } else {
        return Either.right<String, String>(propertyValue)
      }
    }
    return doParse(propertyKey, parserFunction)
  }

  public function getInteger(propertyKey : String) : Either<String, Integer> {
    var parserFunction = \propertyValue : String -> {
      if (propertyValue == null) {
        return Either.right<String, Integer>(null)
      } else {
        try {
          return Either.right<String, Integer>(Integer.parseInt(propertyValue))
        } catch (e : Exception) {
          return Either.left<String, Integer>(e.Message)
        }
      }
    }
    return doParse(propertyKey, parserFunction)
  }

  public function getIntegerMandatory(propertyKey : String) : Either<String, Integer> {
    var parserFunction = \propertyValue : String -> {
      if (propertyValue == null or propertyValue.isEmpty()) {
        return Either.left<String, Integer>("value is null/empty")
      } else {
        try {
          return Either.right<String, Integer>(Integer.parseInt(propertyValue))
        } catch (e : Exception) {
          return Either.left<String, Integer>("value is not a number")
        }
      }
    }
    return doParse(propertyKey, parserFunction)
  }

  public function getBigDecimal(propertyKey : String) : Either<String, BigDecimal> {
    var parserFunction = \propertyValue : String -> {
      if (propertyValue == null) {
        return Either.right<String, BigDecimal>(null)
      } else {
        try {
          return Either.right<String, BigDecimal>(propertyValue.toBigDecimal())
        } catch (e : Exception) {
          return Either.left<String, BigDecimal>(e.Message)
        }
      }
    }
    return doParse(propertyKey, parserFunction)
  }

  public function getDate(propertyKey : String) : Either<String, Date> {
    var parserFunction = \propertyValue : String -> {
      if (GosuStringUtil.isBlank(propertyValue)) {
        return Either.right<String, Date>(null)
      } else if (propertyValue.chars().allMatch(\c -> c == '0') or propertyValue == "99991231") {
        // null date
        return Either.right<String, Date>(null)
      } else {
        try {
          return Either.right<String, Date>(dateFormat.parse(propertyValue))
        } catch (e : Exception) {
          return Either.left<String, Date>(e.Message)
        }
      }
    }
    return doParse(propertyKey, parserFunction)
  }

  /**
   * @param propertyName   name of properties key
   * @param parserFunction function to parse the properties value and return either a valid result or an error description
   * @param <T>
   */
  private function doParse<T>(
      propertyName : String,
      parserFunction(propertyValue : String) : Either<String, T>) : Either<String, T> {

    var propertyValue = props.getProperty(propertyName)?.trim()

    var parseResult = parserFunction(propertyValue)

    if (parseResult.isLeft) {
      // parse error
      var parserResult = PropertiesParserResult
          .create(propertyName, propertyValue)
          .withError(parseResult.left as String)
      _parserResults.add(parserResult)

    } else {
      // parse success
      var parserResult = PropertiesParserResult
          .create(propertyName, propertyValue)
          .withParsedValue(parseResult.right)
      _parserResults.add(parserResult)
    }

    return parseResult
  }

  public static class PropertiesParserResult {
    var _propertyKey : String as readonly PropertyKey
    var _propertyValue : String as readonly PropertyValue
    var _parsedValue : Object as readonly ParsedValue
    var _parseError : String as readonly ParseError

    private construct(propertyKey : String, propertyValue : String) {
      _propertyKey = propertyKey
      _propertyValue = propertyValue
    }

    public static function create(propertyKey : String, propertyValue : String) : PropertiesParserResult {
      return new PropertiesParserResult(propertyKey, propertyValue)
    }

    public function withParsedValue(parsedValue : Object) : PropertiesParserResult {
      this._parsedValue = parsedValue
      return this
    }

    public function withError(error : String) : PropertiesParserResult {
      this._parseError = error
      return this
    }

    public function isValid() : Boolean {
      return _parseError == null
    }

    override function toString() : String {
      return "PropertiesParserResult{key=${_propertyKey},value=${_propertyValue},error=${_parseError}}"
    }
  }

}