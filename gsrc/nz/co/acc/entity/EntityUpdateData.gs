package nz.co.acc.entity

/**
 * Created by Mike Ourednik on 27/01/2020.
 */
class EntityUpdateData {
  var _originalValues : Map<String, String> as OriginalValueMap
  var _newValues : Map<String, String> as NewValueMap

  construct(originalValues : Map<String, String>, newValues : Map<String, String>) {
    _originalValues = originalValues
    _newValues = newValues
  }
}