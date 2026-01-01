package gw.acc.npg.validators

uses gw.acc.npg.model.*
uses gw.acc.npg.model.Exclusion
uses gw.acc.npg.model.Modifier
uses gw.acc.npg.model.RateFactor

/**
 * Visitor for visiting all the models in {@link gw.acc.npg.model.ProductLine}. Visitor lets us define
 * a new operation without changing the model classes on which it operates.
 *
 * @see https://en.wikipedia.org/wiki/Visitor_pattern
 */
interface IModelVisitor {

  function visit(cost: gw.acc.npg.model.Cost)

  function visit(coverable: gw.acc.npg.model.Coverable)

  function visit(field: Field)

  function visit(entity: OtherEntity)

  function visit(line: ProductLine)

  function visit(condition: Condition)

  function visit(coverage: gw.acc.npg.model.Coverage)

  function visit(exclusion: Exclusion)

  function visit(modifier: Modifier)

  function visit(rateFactor: RateFactor)

  function visit(baseCost: BaseCost)

  function visit(transaction: gw.acc.npg.model.Transaction)
}