package edge.servlet.jsonrpc.marshalling.deserialization.dom

uses com.fasterxml.jackson.core.JsonParser
uses java.io.IOException
uses com.fasterxml.jackson.core.JsonToken
uses java.util.ArrayList
uses java.util.HashMap
uses java.io.Reader
uses com.fasterxml.jackson.core.JsonFactory

/**
 * Reader for the DOM values.
 */
final class DomReader {

  /** Reads a stream into the json value. */
  public static function read(reader : Reader) : JsonValue {
    final var p = new JsonFactory().createJsonParser(reader)
    return read(p)
  }

  /** Parses a  json. */
  public static function read(doc : JsonParser) : JsonValue {
    final var res = read(doc, null)
    final var tail = doc.nextToken()
    if (tail != null) {
      throw new IOException("Tailing token (" + tail + ") after the content at " + doc.CurrentLocation)
    }
    return res
  }

  /** Parses a json parser into the json value. */
  private  static function read(doc : JsonParser, etoc : JsonToken) : JsonValue {
    var toc = doc.nextToken()
    switch (toc) {
      case START_ARRAY:
        return readArray(doc)
      case START_OBJECT:
        return readObject(doc)
      case VALUE_TRUE:
        return JsonBooleanValue.TRUE
      case VALUE_FALSE:
        return JsonBooleanValue.FALSE
      case VALUE_NULL:
        return JsonNullValue.NULL
      case VALUE_STRING:
        return new JsonStringValue(doc.Text)
      case VALUE_NUMBER_FLOAT:
        /* Parsing values as floats and doubles could be prone to rounding errors. So we load this as "precise" big
         * decimal and convert this to a less precise types as needed.
         */
        return new JsonBigDecimalValue(doc.DecimalValue)
      case VALUE_NUMBER_INT:
          switch(doc.NumberType) {
            case INT:
                return new JsonIntValue(doc.IntValue)
            case LONG:
                return new JsonLongValue(doc.LongValue)
            case BIG_INTEGER:
                return new JsonBigIntegerValue(doc.BigIntegerValue)
            default:
                throw new IOException("Unsupported numeric type for float literal" + doc.NumberType)
          }
      default:
        if (etoc != null && etoc == toc) {
          return null
        }
        throw new IOException("Unexpected token type " + toc + " near " + doc.CurrentLocation)
    }
  }

  /** Reads a json array. */
  private static function readArray(doc : JsonParser) : JsonValue {
    final var items = new ArrayList<JsonValue>()
    var item = read(doc, JsonToken.END_ARRAY)
    while (item != null) {
      items.add(item)
      item = read(doc, JsonToken.END_ARRAY)
    }

    return new JsonArrayValue(items)
  }



  /** Reads a JSON dom object. */
  private static function readObject(doc : JsonParser) : JsonValue {
    var items = new HashMap<String, JsonValue>()

    var tok = doc.nextToken()
    while (tok == JsonToken.FIELD_NAME) {
      final var name = doc.CurrentName
      items.put(name, read(doc, null))
      tok = doc.nextToken()
    }

    if (tok != JsonToken.END_OBJECT) {
      throw new IOException("Unexpected token in the object " + tok + " at " + doc.CurrentLocation)
    }

    return new JsonObjectValue(items)
  }
}
