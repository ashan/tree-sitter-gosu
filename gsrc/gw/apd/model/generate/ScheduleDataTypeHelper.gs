package gw.apd.model.generate

uses com.google.common.collect.ImmutableSet

@Export
class ScheduleDataTypeHelper {

  //BigDecimal and Money types not currently supported as scheduled item properties on PC runtime
  public final static var FIELD_TYPE_SCHED_SUPPORTED_FOR_CODEGEN : Set<APDFieldType> =
      APDFieldType.AllTypeKeys
          .disjunction({APDFieldType.TC_BIGDECIMAL, APDFieldType.TC_MONEY})

  public final static var FIELD_TYPE_SCHED_COL_NAMES : Map<APDFieldType, String> = {
      APDFieldType.TC_BOOLEAN -> "BoolCol",
      APDFieldType.TC_VARCHAR -> "StringCol",
      APDFieldType.TC_DATE -> "DateCol",
      APDFieldType.TC_INTEGER -> "IntCol",
      APDFieldType.TC_TYPEKEY -> "TypeKeyCol",
      APDFieldType.TC_LOCATION -> "PolicyLocation",
      APDFieldType.TC_PARTY -> "APDInvolvedParty"
  }

  public final static var FIELD_TYPE_SCHED_DATA_TYPES : Map<APDFieldType, String> = {
      APDFieldType.TC_BOOLEAN -> "bit",
      APDFieldType.TC_VARCHAR -> "shorttext",
      APDFieldType.TC_DATE -> "dateonly",
      APDFieldType.TC_INTEGER -> "integer",
      APDFieldType.TC_TYPEKEY -> "patterncode",
      APDFieldType.TC_LOCATION -> "PolicyLocation",
      APDFieldType.TC_PARTY -> "APDPolicyInvolvedParty"
  }

  public static function calculateScheduleFieldTypeCounts(line : APDProductLine) : Map<APDFieldType, Integer> {
    var allSchedClauses = line.AllClauses.where(\elt -> elt.HasSchedule)
    var maxFieldCountByDataType : Map<APDFieldType, Integer> = new HashMap<APDFieldType, Integer>()

    for (schedClause in allSchedClauses) {
      var fieldCountsOnSched = schedClause.ScheduleItemProperties.partition(\elt -> elt.Type)
      for (fieldType in APDFieldType.AllTypeKeys) {
        var fieldCountForType = fieldCountsOnSched.get(fieldType).Count
        var fieldCountOnMap = maxFieldCountByDataType.get(fieldType)
        if (fieldCountOnMap == null || fieldCountForType > fieldCountOnMap) {
          maxFieldCountByDataType.put(fieldType,fieldCountForType)
        }
      }
    }
    return maxFieldCountByDataType;
  }

}