package gw.acc.npg.builders

uses gw.acc.npg.model.BaseCost
uses gw.acc.npg.model.Cost
uses gw.acc.npg.model.Field
uses gw.acc.npg.model.Coverable
uses gw.acc.npg.model.Coverage


/**
 * Builder for building costs
 */
class CostBuilder extends BaseProductModelBuilder<CostBuilder> {

  var _entityName: String
  var _description: String
  var _referenceName: String
  var _coverable: Coverable
  var _coverage: Coverage
  var _additionalFields: List<Field>
  var _parentCost: BaseCost
  var _superEntityName: String

  construct() {
    _additionalFields = new ArrayList<Field>()
  }

  public function withEntityName(name: String): CostBuilder {
    _entityName = name
    return this
  }

  public function withDescription(desc: String): CostBuilder {
    _description = desc
    return this
  }

  public function withReferenceName(referenceName: String): CostBuilder {
    _referenceName = referenceName
    return this
  }

  public function withCoverage(coverage: Coverage): CostBuilder {
    _coverage = coverage
    return this
  }


  public function withSuffix(suffix: String): CostBuilder {
    _suffix = suffix
    return this
  }

  public function withCoverable(coverable: Coverable): CostBuilder {
    _coverable = coverable
    return this
  }

  public function withParentCost(parentCost: BaseCost): CostBuilder {
    _parentCost = parentCost
    return this
  }

  public function withSuperEntityName(superEntityName: String): CostBuilder {
    _superEntityName = superEntityName
    return this
  }


  public function withAdditionalField(field: Field): CostBuilder {
    _additionalFields.add(field)
    return this
  }

  public static function createBuilder(): CostBuilder {
    return new CostBuilder()
  }

  /**
   * @return new coverable with provided information
   */
  public function build(): Cost {
    var cost = new Cost()
    cost.EntityName = _entityName
    cost.Description = _description
    cost.ReferenceName = _referenceName
    cost.LineEntityName = _lineEntityName
    cost.Coverage = _coverage
    cost.Coverable = _coverable
    cost.Suffix = _suffix
    cost.ParentCost = _parentCost
    cost.PackageName = _packageName
    cost.Abbrevation = _abbr
    cost.LineDisplayName = _lineDisplayName
    cost.AdditionalFields = _additionalFields
    cost.SuperEntityName = _superEntityName
    return cost
  }
}