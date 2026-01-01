package nz.co.acc.plm.util

/**
 * Created by OurednM on 14/06/2018.
 */
enhancement OptionalEnhancement_ACC<T>: Optional<T> {

  function each(operation(elt: T): void) {
    if (this.isPresent()) {
      operation(this.get())
    }
  }

  function toList(): List<T> {
    if (this.isPresent()) {
      return {this.get()}
    } else {
      return {}
    }
  }
}
