package nz.co.acc.plm.util

/**
 * Created by OurednM on 17/04/2018.
 */
enhancement ListEnhancement_ACC<T>: List<T> {

  /**
   * Returns list with null elements filtered out
   */
  function filterNulls(): List<T> {
    return this.where(\x -> x != null)
  }

  reified function lastOption(): Optional<T> {
    return Optional.ofNullable(this.last())
  }
}
