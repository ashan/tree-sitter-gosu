package nz.co.acc.common.integration.apimgmt.json

uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

/**
 * Created by samarak on 12/05/2017.
 */
@JsonIgnoreProperties(false, false, false, {"intrinsicType"})
class JSONUser {
  public var LinkID: String
  public var PrimaryEmail: String
  public var UpdateTime: String
}