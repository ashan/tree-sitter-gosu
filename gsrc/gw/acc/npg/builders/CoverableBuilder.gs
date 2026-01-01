package gw.acc.npg.builders

uses gw.acc.npg.model.*
uses gw.acc.npg.model.Cost
uses gw.acc.npg.model.Coverable


/**
 * Builder for building coverables
 */
class CoverableBuilder<C extends CoverableBuilder> extends BaseProductModelBuilder<C> {

  internal var _entityName: String
  internal var _description: String
  internal var _referenceName: String
  internal var _referredFrom: String
  internal var _refereredFromCoverable: Coverable
  internal var _attachToLocation: boolean
  internal var _attachToBuilding: boolean
  internal var _includeConditions: boolean
  internal var _includeExclusions: boolean
  internal var _includeModifiers: boolean
  internal var _coverables: List<gw.acc.npg.model.Coverable>
  internal var _costs: List<gw.acc.npg.model.Cost>
  internal var _additionalFields: List<Field>

  construct() {
    _coverables = new ArrayList<Coverable>()
    _costs = new ArrayList<Cost>()
    _additionalFields = new ArrayList<Field>()
  }

  public function withEntityName(name: String): C {
    _entityName = name
    return this as C
  }

  public function withDescription(desc: String): C {
    _description = desc
    return this as C
  }

  public function withReferenceName(referenceName: String): C {
    _referenceName = referenceName
    return this as C
  }

  public function withReferredFrom(refereredFrom: String): C {
    _referredFrom = refereredFrom
    return this as C
  }

  public function withReferredFromCoverable(refereredFromCoverable: Coverable): C {
    _refereredFromCoverable = refereredFromCoverable
    return this as C
  }

  public function withAttachToBuilding(attachToBuilding: boolean): C {
    _attachToBuilding = attachToBuilding
    return this as C
  }

  public function withAttachToLocation(attachToLocation: boolean): C {
    _attachToLocation = attachToLocation
    return this as C
  }

  public function withIncludeModifiers(includeModifiers: boolean): C {
    _includeModifiers = includeModifiers
    return this as C
  }

  public function withIncludeConditions(includeConditions: boolean): C {
    _includeConditions = includeConditions
    return this as C
  }

  public function withIncludeExclusions(includeExclusions: boolean): C {
    _includeExclusions = includeExclusions
    return this as C
  }

  public function withCoverable(coverable: Coverable): C {
    _coverables.add(coverable)
    return this as C
  }

  public function withCost(cost: Cost): C {
    _costs.add(cost)
    return this as C
  }

  public function withAdditionalField(field: Field): C {
    _additionalFields.add(field)
    return this as C
  }

  public static function createBuilder(): CoverableBuilder {
    return new CoverableBuilder<CoverableBuilder>()
  }

  /**
   * @return new coverable with provided information
   */
  public function build(): Coverable {
    var coverable = new Coverable()
    coverable.AttachToBuilding = _attachToBuilding
    coverable.AttachToLocation = _attachToLocation
    coverable.IncludeCondition = _includeConditions
    coverable.IncludeExclusion = _includeExclusions
    coverable.IncludeModifier = _includeModifiers
    coverable.EntityName = _entityName
    coverable.ReferenceName = _referenceName
    coverable.ReferredFrom = _referredFrom
    coverable.ReferredFromCoverable = _refereredFromCoverable
    coverable.Costs = _costs
    coverable.Coverables = _coverables
    coverable.Description = _description
    coverable.Suffix = _suffix
    coverable.Abbrevation = _abbr
    coverable.LineDisplayName = _lineDisplayName
    coverable.LineEntityName = _lineEntityName
    coverable.PackageName = _packageName
    coverable.AdditionalFields = _additionalFields
    populateDependencies(coverable)
    return coverable
  }

  protected function populateDependencies<T extends gw.acc.npg.model.Coverable>(coverable: T) {
    var rateFactor = new gw.acc.npg.model.RateFactor()
    rateFactor.Suffix = _suffix
    rateFactor.Abbrevation = _abbr
    rateFactor.LineDisplayName = _lineDisplayName
    rateFactor.LineEntityName = _lineEntityName
    rateFactor.PackageName = _packageName
    rateFactor.Coverable = coverable
    var modifier = new gw.acc.npg.model.Modifier()
    modifier.Suffix = _suffix
    modifier.Abbrevation = _abbr
    modifier.LineDisplayName = _lineDisplayName
    modifier.LineEntityName = _lineEntityName
    modifier.PackageName = _packageName
    modifier.Coverable = coverable
    var condition = new Condition()
    condition.Suffix = _suffix
    condition.Abbrevation = _abbr
    condition.LineDisplayName = _lineDisplayName
    condition.LineEntityName = _lineEntityName
    condition.PackageName = _packageName
    condition.Coverable = coverable
    var exclusion = new gw.acc.npg.model.Exclusion()
    exclusion.Suffix = _suffix
    exclusion.Abbrevation = _abbr
    exclusion.LineDisplayName = _lineDisplayName
    exclusion.PackageName = _packageName
    exclusion.Coverable = coverable
    var coverage = new gw.acc.npg.model.Coverage()
    coverage.Suffix = _suffix
    coverage.Abbrevation = _abbr
    coverage.LineDisplayName = _lineDisplayName
    coverage.LineEntityName = _lineEntityName
    coverage.PackageName = _packageName
    coverage.Coverable = coverable

    coverable.RateFactor = rateFactor
    coverable.Modifier = modifier
    coverable.Condition = condition
    coverable.Exclusion = exclusion
    coverable.Coverage = coverage
  }
}