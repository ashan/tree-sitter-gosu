package nz.co.acc.history

public class HistoryItem {
  var _field : String
  var _oldValue : String
  var _newValue : String

  construct(fieldName : String, oldValue : String, newValue : String) {
    this._field = fieldName
    this._newValue = newValue
    this._oldValue = oldValue
  }

  property get OldValue() : String {
    return _oldValue
  }

  property get NewValue() : String {
    return _newValue
  }

  property get Field() : String {
    return _field
  }
}