<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants
uses gw.apd.model.generate.APDGosuReferencesHelper

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.api.productmodel.ClauseSchedulePattern
uses gw.api.productmodel.SchedulePropertyInfo
uses gw.api.productmodel.SchedulePropertyValueProvider
uses gw.entity.IEntityPropertyInfo
uses gw.lang.reflect.IPropertyInfo
uses gw.lob.common.AbstractProductModelScheduleImpl

@Export
class ${coverable.QualifiedName}ScheduleExclImplBase extends AbstractProductModelScheduleImpl<${coverable.QualifiedName}ScheduleExcl> {

  construct(owner : entity.${coverable.QualifiedName}ScheduleExcl) {
    super(owner)
  }

  override property get PropertyInfosMap() : Map<String, SchedulePropertyInfo> {
    var propInfos = super.PropertyInfosMap

    for (entrySet in propInfos.entrySet()) {
      if (entrySet.Value.PropertyInfo.Type == APDPolicyInvolvedParty) {
        propInfos.put(entrySet.Key, new APDInvolvedPartyPropInfoWrapper(entrySet.Value))
      }
    }

    return propInfos
  }

  override protected function getPropertyInfos(schedulePattern : ClauseSchedulePattern) : SchedulePropertyInfo[] {
    var propInfos = super.getPropertyInfos(schedulePattern)

    return propInfos.map(\prop -> {
      return (prop.PropertyInfo.Type == APDPolicyInvolvedParty)
            ? new APDInvolvedPartyPropInfoWrapper(prop)
            : prop
    })
  }

  override property get SchedulePattern() : ClauseSchedulePattern {
    return Owner.getPattern().getClauseSchedulePattern()
  }

  override property get ScheduledItems() : ScheduledItem[] {
    return Owner.${coverable.QualifiedName}ScheduledItems
  }

  override function createAndAddScheduledItem() : ScheduledItem {
    var scheduledItem = new ${coverable.QualifiedName}ScheduleExclItem(Owner.Branch)
    createAutoNumber(scheduledItem)
    Owner.addTo${coverable.QualifiedName}ScheduledItems(scheduledItem)
    initializeScheduledItem(scheduledItem)
    return scheduledItem
  }

  override function removeScheduledItem(item : ScheduledItem) {
    Owner.removeFrom${coverable.QualifiedName}ScheduledItems(item as ${coverable.QualifiedName}ScheduleExclItem)
    renumberAutoNumberSequence()
  }

  override property get CurrentAndFutureScheduledItems() : KeyableBean[] {
    var schedItems = Owner.ScheduledItems.toList()

    Owner.Branch.OOSSlices
        .where(\p -> p.${coverable.ProductLine.CodeIdentifier} != null)
        .each(\p -> {
          var matchingSlicedScheduleExcl = p.${APDGosuReferencesHelper.getReferenceFromPeriodToAllCoverablesOfThisType(coverable)}.ExclusionsFromCoverable.firstWhere(\c -> c.FixedId == Owner.FixedId) as ${coverable.QualifiedName}ScheduleExcl
          if (matchingSlicedScheduleExcl != null) {
            matchingSlicedScheduleExcl.ScheduledItems.each(\s -> {
              if (not schedItems.contains(s)) {
                schedItems.add(s)
              }
            })
          }
        })

    return schedItems.map(\item -> item as ${coverable.QualifiedName}ScheduleExclItem).toTypedArray()
  }

  override property get ScheduleNumberPropInfo() : IPropertyInfo {
    return ${coverable.QualifiedName}ScheduleExclItem.Type.TypeInfo.getProperty("ScheduleNumber")
  }

  private class APDInvolvedPartyPropInfoWrapper implements SchedulePropertyInfo {
    delegate _originalPropInfo represents SchedulePropertyInfo

    construct(schedPropInfo : SchedulePropertyInfo) {
      _originalPropInfo = schedPropInfo
    }

    override property get ValueType() : String {
      return entity.APDPolicyInvolvedParty.RelativeName
    }
  }

}