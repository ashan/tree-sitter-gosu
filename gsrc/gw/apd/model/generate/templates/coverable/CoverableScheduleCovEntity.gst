<%@ params( cbl : APDCoverable ) %>
<?xml version="1.0"?>
<subtype
  desc="${cbl.QualifiedName} coverage with a schedule"
  xmlns="http://guidewire.com/datamodel"
  entity="${cbl.QualifiedName}ScheduleCov"
  supertype="${cbl.QualifiedName}Cov">
  <implementsInterface
    iface="gw.api.domain.Schedule"
    impl="${cbl.LOBPackageName}.${cbl.QualifiedName}ScheduleCovImpl"/>
  <implementsEntity
    name="ScheduleAutoNumberSequence"/>
  <array
    arrayentity="${cbl.QualifiedName}ScheduleCovItem"
    cascadeDelete="true"
    desc="Scheduled Items"
    name="${cbl.QualifiedName}ScheduledItems"/>
</subtype>