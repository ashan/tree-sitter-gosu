package gw.acc.npg.builders

uses gw.acc.npg.model.Cost
uses gw.acc.npg.model.Coverable
uses gw.acc.npg.model.Coverage


/**
 * Builder for building coverage
 */
class CoverageBuilder extends BaseProductModelBuilder<CoverageBuilder> {

  var _coverable: Coverable

  public function withCoverable(coverable: Coverable): CoverageBuilder {
    _coverable = coverable
    return this
  }

  public static function createBuilder(): CoverageBuilder {
    return new CoverageBuilder()
  }

  /**
   * @return new coverage with provided information
   */
  public function build(): Coverage {
    var coverage = new Coverage()
    coverage.Coverable = _coverable
    coverage.Suffix = _suffix
    coverage.PackageName = _packageName
    coverage.Abbrevation = _abbr
    coverage.LineDisplayName = _lineDisplayName
    coverage.LineEntityName = _lineEntityName
    return coverage
  }
}