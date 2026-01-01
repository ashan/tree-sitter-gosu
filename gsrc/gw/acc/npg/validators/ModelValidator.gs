package gw.acc.npg.validators

uses gw.acc.npg.model.BaseCost
uses gw.acc.npg.model.Condition
uses gw.acc.npg.model.Field
uses gw.acc.npg.model.OtherEntity
uses gw.acc.npg.model.ProductLine

/**
 * Abstract model validator implements {@link gw.acc.npg.validators.IModelVisitor},
 * facilitate various type of validations on {@link gw.acc.npg.model.ProductLine} models.
 */
abstract class ModelValidator implements IModelVisitor {

  /**
   * BrokenRule specifies all the validation messages collected after executing this validator.
   */
  private var _brokenRules: List<String>as BrokenRules

  construct() {
    _brokenRules = new ArrayList<String>()
  }


  override function visit(cost: gw.acc.npg.model.Cost) {
  }

  override function visit(coverable: gw.acc.npg.model.Coverable) {
  }

  override function visit(condition: Condition) {
  }

  override function visit(coverage: gw.acc.npg.model.Coverage) {
  }

  override function visit(exclusion: gw.acc.npg.model.Exclusion) {
  }

  override function visit(modifier: gw.acc.npg.model.Modifier) {
  }

  override function visit(rateFactor: gw.acc.npg.model.RateFactor) {
  }

  override function visit(baseCost: BaseCost) {
  }

  override function visit(transaction: gw.acc.npg.model.Transaction) {
  }

  override function visit(entity: OtherEntity) {
  }

  override function visit(line: ProductLine) {
  }

  override function visit(field: Field) {
  }
}