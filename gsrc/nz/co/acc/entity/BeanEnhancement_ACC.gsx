package nz.co.acc.entity

/**
 * Enhancements to all beans
 */
enhancement BeanEnhancement_ACC : gw.pl.persistence.core.Bean {

  /**
   * Allows us to mark an entity removeable in an XML model for data migration
   */
  property get MigrationRemoveEntity_ACC() : boolean {
    return false
  }

  function getEntityUpdateData() : EntityUpdateData {
    var changedFields = this.ChangedFields
    changedFields.remove("LastUpdateTime")
    changedFields.remove("UpdateTime_ACC")

    if (changedFields.HasElements) {

      var strFunc : block(x : Object) : String = \x : Object -> {
        if (x typeis KeyableBean) {
          return x.ID.toString()
        } else if (x typeis gw.entity.TypeKey) {
          return x.DisplayName
        } else if (x typeis Date) {
          return x.toISOTimestamp()
        } else {
          return String.valueOf(x)
        }
      }

      var origValueMap = new HashMap<String, String>(changedFields.size())
      var newValueMap = new HashMap<String, String>(changedFields.size())

      for (field in changedFields) {
        var originalValue = this.OriginalVersion.getFieldValue(field)

        if (not(typeof originalValue).Array) {
          var newValue = this.getFieldValue(field)
          origValueMap.put(field, strFunc(originalValue))
          newValueMap.put(field, strFunc(newValue))
        }
      }

      return new EntityUpdateData(origValueMap, newValueMap)
    }

    return null
  }
}
