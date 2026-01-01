package gw.acc.npg.model

/**
 * All column types for entity column
 */
enum ColumnType {
  Bit("bit"),
  Integer("integer"),
  Longint("longint"),
  Positiveinteger("positiveinteger"),
  Nonnegativeinteger("nonnegativeinteger"),
  Decimal("decimal"),
  Percentage("percentage"),
  Rate("rate"),
  Money("money"),
  Shorttext("shorttext"),
  Mediumtext("mediumtext"),
  Longtext("longtext"),
  Varchar("varchar"),
  Datetime("datetime"),
  Array("array"),
  Foreignkey("foreignkey"),
  Typekey("typekey"),
  PatternCode("patterncode"),
  AutoNumber("auto-numbering")

  var _type: String

  /**
   * @param typeName
   * @return ColumnType for given type name
   */
  public static function fromTypeName(typeName: String): ColumnType {
    var type = values().firstWhere(\elt -> elt._type == typeName)
    if (type == null) {
      throw new UnsupportedOperationException("Column data type: ${typeName} is not supported.")
    }
    return type
  }

  private construct(type: String) {
    this._type = type
  }
}