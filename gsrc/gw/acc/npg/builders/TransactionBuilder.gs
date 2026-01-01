package gw.acc.npg.builders

uses gw.acc.npg.model.Transaction
uses gw.acc.npg.model.BaseCost

/**
 * Builder for building {@link Transaction}
 */
class TransactionBuilder extends BaseProductModelBuilder<TransactionBuilder> {

  private var _cost: BaseCost

  public function withCost(cost: BaseCost): TransactionBuilder {
    _cost = cost
    return this
  }

  public static function createBuilder(): TransactionBuilder {
    return new TransactionBuilder()
  }

  /**
   * @return new {@link OtherEntity} with provided information
   */
  public function build(): Transaction {
    var transaction = new Transaction()
    transaction.Suffix = _suffix
    transaction.LineDisplayName = _lineDisplayName
    transaction.Abbrevation = _abbr
    transaction.PackageName = _packageName
    transaction.LineEntityName = _lineEntityName
    transaction.Cost = _cost
    return transaction
  }
}