package nz.co.acc.common.integration.apimgmt.json

uses com.fasterxml.jackson.annotation.JsonFilter
uses com.fasterxml.jackson.annotation.JsonIgnore
uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

/**
 * JSON Payload pojo for the Note entity. This payload is constructed based on the API Management's
 * REST WebService interface for the Guidewire Applications.
 */
@JsonIgnoreProperties(false, false, false, {"intrinsicType"})
class JSONNote {
  public var LinkID: String
  public var Topic: String
  public var SubTopic: String
  public var Subject: String
  public var SecurityType: String
  public var Text: String
  public var Author: JSONUser
  public var UpdateTime: String
}