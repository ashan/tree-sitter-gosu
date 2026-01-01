package nz.co.acc.common.integration.apimgmt.json

uses com.fasterxml.jackson.annotation.JsonInclude
uses com.fasterxml.jackson.databind.ObjectMapper
uses com.fasterxml.jackson.databind.SerializationFeature
uses com.fasterxml.jackson.databind.ser.impl.SimpleBeanPropertyFilter
uses com.fasterxml.jackson.databind.ser.impl.SimpleFilterProvider

/**
 * Serializer and Deserializer utility to convert from JSON pojo to String and back.
 *
 * @param <T> The JSON payload pojo type
 */
class JSONSerializer<T> {

  final var _objectMapper: ObjectMapper;

  construct() {
    _objectMapper = new ObjectMapper()
    _objectMapper.setSerializationInclusion(JsonInclude.Include.ALWAYS)
  }

  /**
   * initialise the serializer by reading the values from script parameters.
   */
  private final function init() {
    var beautify = ScriptParameters.APIMgmtJSONPayloadBeautify_ACC
    _objectMapper.configure(SerializationFeature.INDENT_OUTPUT, beautify);
  }

  /**
   * Converts pojo to String.
   *
   * @param obj json pojo
   * @return string representation
   */
  function toJSON(obj: Object): String {
    return this.toJSON(obj, null)
  }

  /**
   * Converts pojo to String. Applies the filter before serialisation for any field exclusions.
   *
   * @param obj    json pojo
   * @param filter filter to apply when generating the payload string
   * @return string representation
   */
  function toJSON(obj: Object, filter: SimpleBeanPropertyFilter): String {
    if (obj == null) {
      throw new IllegalArgumentException("Object cannot be null!")
    }
    init() //refresh config

    var filters: SimpleFilterProvider = null
    if (filter != null) {
      filters = new SimpleFilterProvider().addFilter("filter", filter);
      return _objectMapper.writer(filters).writeValueAsString(obj)
    } else {
      return _objectMapper.writeValueAsString(obj)
    }
  }

  /**
   * Converts a JSON string payload to a pojo
   *
   * @param jsonString payload as a string
   * @return instance of type T.
   */
  function fromJSON(jsonString: String): T {
    init() //refresh config
    return _objectMapper.readValue(jsonString, T)
  }
}

