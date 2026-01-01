package edge.capabilities.policychange.dto

uses edge.jsonmapper.JsonProperty

uses java.lang.Long
uses java.util.Date

class PolicyChangeHistoryDTO {

  /** The FixedID of the item being changed. (Driver, Vehicle,...) */
  @JsonProperty
  var _fixedId : Long as FixedId

  /** The name of the item being changed */
  @JsonProperty
  var _name : String as ItemName

  /** A string in the set ['added','removed','changed'] indicating the kind of change. */
  @JsonProperty
  var _action : String as Action

  /** Type of item being changed, for PersonalAuto this string can be: 'vehicle', 'driver', 'address' or 'coverage' */
  @JsonProperty
  var _entityType : String as EntityType

  /** The owning PolicyLine */
  @JsonProperty
  var _parentId : Long as ParentId

  @JsonProperty
  /** The date the change was instantiated (for mortgagees on Homeowners policies) */
  var _effectiveDate : Date as EffectiveDate
}
