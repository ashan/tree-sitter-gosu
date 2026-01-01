<%@ params( cbl : APDCoverable ) %>
<?xml version="1.0"?>
<subtype
  desc="${cbl.QualifiedName} condition with a schedule"
  xmlns="http://guidewire.com/datamodel"
  entity="${cbl.QualifiedName}ScheduleCond"
  supertype="${cbl.QualifiedName}Cond">
  <implementsInterface
    iface="gw.api.domain.Schedule"
    impl="${cbl.LOBPackageName}.${cbl.QualifiedName}ScheduleCondImpl"/>
  <implementsEntity
    name="ScheduleAutoNumberSequence"/>
  <array
    arrayentity="${cbl.QualifiedName}ScheduleCondItem"
    cascadeDelete="true"
    desc="Scheduled Items"
    name="${cbl.QualifiedName}ScheduledItems"/>
</subtype>