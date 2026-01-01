<%@ params(exposure : APDExposure) %>
<?xml version="1.0"?>
<Entity
  name="${exposure.QualifiedName}">
<%if (exposure.AutoNumber) {%>
  <Columns>
    <Column
      beanPath="${exposure.QualifiedName}.SequenceNumber"
      name="SequenceNumber"/>
  </Columns>
  <DisplayName><![CDATA[
return SequenceNumber.toString().concat(": ") + DisplayKey.get("entity.${exposure.QualifiedName}")
<%} else {%>
  <Columns/>
  <DisplayName><![CDATA[
return DisplayKey.get("entity.${exposure.QualifiedName}")
<%}%>
]]></DisplayName>
</Entity>
