package gw.acc.npg.builders

uses gw.acc.npg.model.BaseCost

/**
 * Builder for building {@link BaseCost}
 */
class BaseCostBuilder extends BaseProductModelBuilder<BaseCostBuilder> {

  public static function createBuilder(): BaseCostBuilder {
    return new BaseCostBuilder()
  }

  /**
   * @return new {@link BaseCost} with provided information
   */
  public function build(): BaseCost {
    var cost = new BaseCost()
    cost.Suffix = _suffix
    cost.LineDisplayName = _lineDisplayName
    cost.LineEntityName = _lineEntityName
    cost.Abbrevation = _abbr
    cost.PackageName = _packageName
    return cost
  }
}