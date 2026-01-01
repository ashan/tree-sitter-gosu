package nz.co.acc.plm.integration.validation.nzbnvalidation

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.lang.reflect.json.Json

class MBIEAPIClientResponse {
  private var _statusCode : Integer as readonly StatusCode
  private var _responseBody : String as readonly ResponseBody
  private var _NZBN : String as readonly NZBN

  construct(statusCode : Integer, responseBody : String, nzbn : String) {
    this._statusCode = statusCode
    this._responseBody = responseBody
    this._NZBN = _NZBN

  }


}

