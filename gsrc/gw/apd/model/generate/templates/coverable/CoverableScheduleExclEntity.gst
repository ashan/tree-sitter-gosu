<%@ params( cbl : APDCoverable ) %>
<?xml version="1.0"?>
<subtype
  desc="${cbl.QualifiedName} exclusion with a schedule"
  xmlns="http://guidewire.com/datamodel"
  entity="${cbl.QualifiedName}ScheduleExcl"
  supertype="${cbl.QualifiedName}Excl">
  <implementsInterface
    iface="gw.api.domain.Schedule"
    impl="${cbl.LOBPackageName}.${cbl.QualifiedName}ScheduleExclImpl"/>
  <implementsEntity
    name="ScheduleAutoNumberSequence"/>
  <array
    arrayentity="${cbl.QualifiedName}ScheduleExclItem"
    cascadeDelete="true"
    desc="Scheduled Items"
    name="${cbl.QualifiedName}ScheduledItems"/>
</subtype>