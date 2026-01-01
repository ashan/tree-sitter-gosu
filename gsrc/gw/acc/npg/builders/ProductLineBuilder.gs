package gw.acc.npg.builders

uses gw.acc.npg.model.OtherEntity
uses gw.acc.npg.model.ProductLine


/**
 * Builder for building product line
 */
class ProductLineBuilder extends CoverableBuilder<ProductLineBuilder> {

  private var _productCode: String
  private var _lineCode: String
  private var _otherEntities: List<OtherEntity>

  construct() {
    _otherEntities = new ArrayList<OtherEntity>()
  }

  public function withOtherEntity(otherEntity: OtherEntity): ProductLineBuilder {
    _otherEntities.add(otherEntity)
    return this
  }

  public function withProductCode(productCode: String): ProductLineBuilder {
    _productCode = productCode
    return this
  }

  public function withLineCode(lineCode: String): ProductLineBuilder {
    _lineCode = lineCode
    return this
  }

  public static function createBuilder(): ProductLineBuilder {
    return new ProductLineBuilder()
  }

  /**
   * @return new coverable with provided information
   */
  public function build(): ProductLine {
    var productLine = new ProductLine()
    productLine.AttachToBuilding = _attachToBuilding
    productLine.AttachToLocation = _attachToLocation
    productLine.IncludeCondition = _includeConditions
    productLine.IncludeExclusion = _includeExclusions
    productLine.IncludeModifier = _includeModifiers
    productLine.EntityName = _entityName
    productLine.LineEntityName = _lineEntityName
    productLine.ReferenceName = _referenceName
    productLine.ReferredFrom = _referredFrom
    productLine.Costs = _costs
    productLine.Coverables = _coverables
    productLine.Description = _description
    productLine.Suffix = _suffix
    productLine.Abbrevation = _abbr
    productLine.LineDisplayName = _lineDisplayName
    productLine.PackageName = _packageName
    productLine.AdditionalFields = _additionalFields
    productLine.ProductCode = _productCode
    productLine.LineCode = _lineCode
    productLine.OtherEntities = _otherEntities
    productLine.BaseCost = BaseCostBuilder.createBuilder()
        .withLineEntityName(_entityName)
        .withSuffix(_suffix)
        .withLineDisplayName(_lineDisplayName)
        .withAbbrevation(_abbr)
        .withPackageName(_packageName)
        .build()
    productLine.Transaction = TransactionBuilder.createBuilder()
        .withSuffix(_suffix)
        .withLineDisplayName(_lineDisplayName)
        .withAbbrevation(_abbr)
        .withPackageName(_packageName)
        .withCost(productLine.BaseCost)
        .build()

    populateDependencies(productLine)
    return productLine
  }
}