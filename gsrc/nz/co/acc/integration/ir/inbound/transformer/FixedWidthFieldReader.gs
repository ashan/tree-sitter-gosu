package nz.co.acc.integration.ir.inbound.transformer

uses java.math.BigDecimal

class FixedWidthFieldReader {
  var _line = ""
  var _index = 0

  public construct(line : String) {
    if (line == null) {
      throw new NullPointerException("'line' is null")
    }
    _line = line
  }

  public function nextString(fieldLength : int) : String {
    var nextIndex = _index + fieldLength
    if (nextIndex > _line.length) {
      throw new IRLoadException("Read position ${nextIndex} exceeds line length ${_line.length}")
    }
    var field = _line.substring(_index, _index + fieldLength)
    _index += fieldLength
    return field.trim()
  }

  public function nextInteger(fieldLength : int) : Integer {
    return nextString(fieldLength).toInt()
  }

  public function nextBigDecimal(fieldLength : int) : Optional<BigDecimal> {
    var field = nextString(fieldLength)
    if (field.HasContent) {
      return Optional.of(field.toBigDecimal())
    } else {
      return Optional.empty()
    }
  }

}