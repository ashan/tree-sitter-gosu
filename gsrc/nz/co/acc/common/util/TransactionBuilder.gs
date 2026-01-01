package nz.co.acc.common.util

uses com.guidewire.pl.system.dependency.PLDependencies
uses gw.transaction.Transaction

/**
 * Created by Mike Ourednik on 10/10/2019.
 */
class TransactionBuilder {

  var _user : User
  var _blockRunnable : gw.transaction.Transaction.BlockRunnable
  var _maxRetries : Integer = 0
  var _retryDelaySeconds : Integer = 5

  public function withSystemUser() : TransactionBuilder {
    _user = PLDependencies.getUserFinder().findByCredentialName("sys")
    return this
  }

  public function withBlockRunnable(blockRunnable : Transaction.BlockRunnable) : TransactionBuilder {
    _blockRunnable = blockRunnable
    return this
  }

  public function withRetryDelaySeconds(retryDelaySeconds : Integer) : TransactionBuilder {
    _retryDelaySeconds = retryDelaySeconds
    return this
  }

  public function withMaxRetries(maxRetries : Integer) : TransactionBuilder {
    _maxRetries = maxRetries
    return this
  }

  public function execute() {
    assert(_blockRunnable != null)
    assert(_user != null)

    var attempts = 0

    while (attempts <= _maxRetries) {
      try {
        attempts += 1
        gw.transaction.Transaction.runWithNewBundle(_blockRunnable, _user)
        return
      } catch (e : com.guidewire.pl.system.exception.ConcurrentDataChangeException) {
        print(e.StackTraceAsString)
        print("Waiting ${_retryDelaySeconds} before retrying transaction...")
        Thread.sleep(_retryDelaySeconds * 1000)
      }
    }
  }
}
