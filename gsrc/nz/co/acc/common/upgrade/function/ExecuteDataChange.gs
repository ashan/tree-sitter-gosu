package nz.co.acc.common.upgrade.function

uses gw.transaction.Transaction

uses java.util.function.Consumer

/**
 * @author Ron Webb
 * @since 2019-06-25
 */
class ExecuteDataChange implements Consumer<DataChange> {

  protected var _user : User

  construct(user : User) {
    _user = user
  }

  construct() {
    this(User.util.getUnrestrictedUser())
  }

  override function accept(dataChange : DataChange) {
    Transaction.runWithNewBundle(\___bundle -> {
      dataChange = ___bundle.add(dataChange)
      dataChange.execute()
    }, _user)
  }
}