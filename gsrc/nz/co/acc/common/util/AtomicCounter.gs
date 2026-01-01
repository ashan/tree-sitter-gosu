package nz.co.acc.common.util

uses java.util.concurrent.atomic.AtomicLong

/**
 * Created by Mike Ourednik on 15/08/20.
 */
class AtomicCounter {
  private var _counter = new AtomicLong(0)

  function getValue() : Long {
    return _counter.get()
  }

  function increment() {
    while (true) {
      var existingValue = getValue()
      var newValue = existingValue + 1
      if (_counter.compareAndSet(existingValue, newValue)) {
        return
      }
    }
  }

}