package nz.co.acc.plm.integration.ir.ui

uses java.util.Date
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

/**
 * Wrapper class for UI
 */
class InboundPayloadWrapper {

 var _isOriginal : boolean as IsOriginal
 var _payload : String as Payload
 var _createUser : User as CreateUser
 var _timestamp : Date as Timestamp

 /**
  * Display title for card
  */
 public property get TitleDisplay() : String {
   return _isOriginal ? "Original" : TimestampDisplay
 }

 /**
  * The timestamp for the payload.
  */
  public property get TimestampDisplay() : String {
   return _timestamp.format(ConstantPropertyHelper.DATE_FORMAT_dMYHmsS)
 }

}