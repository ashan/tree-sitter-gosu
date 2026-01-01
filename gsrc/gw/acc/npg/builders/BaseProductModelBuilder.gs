package gw.acc.npg.builders

/**
 * Builder for building {@link T} model with basic information.
 *
 * @param <T> Type of builder with additional information, this type will extend {@link BaseProductModelBuilder}
 */
class BaseProductModelBuilder<T extends BaseProductModelBuilder> {

  internal var _suffix: String
  internal var _abbr: String
  internal var _lineDisplayName: String
  internal var _packageName: String
  internal var _lineEntityName: String

  public function withLineEntityName(lineEntityName: String): T {
    _lineEntityName = lineEntityName
    return this as T
  }

  public function withSuffix(suffix: String): T {
    _suffix = suffix
    return this as T
  }

  public function withAbbrevation(abbr: String): T {
    _abbr = abbr
    return this as T
  }

  public function withLineDisplayName(lineDisplayName: String): T {
    _lineDisplayName = lineDisplayName
    return this as T
  }

  public function withPackageName(packageName: String): T {
    _packageName = packageName
    return this as T
  }

}