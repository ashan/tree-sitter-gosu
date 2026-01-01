<%@ params(coverable:APDCoverable, t : String) %>
<?xml version="1.0"?>
<Entity
  name="${coverable.LinePrefix.concat(coverable.TypeName).concat(t)}">
  <Columns>
    <Column
      beanPath="${coverable.LinePrefix.concat(coverable.TypeName).concat(t)}.Pattern"
      name="pattern"/>
  </Columns>
  <DisplayName><![CDATA[pattern]]></DisplayName>
</Entity>