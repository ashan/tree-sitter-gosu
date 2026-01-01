<%@ params( coverable : APDCoverable, type : String ) %>
<?xml version="1.0"?>
<Entity
  name="${coverable.QualifiedName}Schedule${type}Item">
  <Columns>
    <Column
      beanPath="${coverable.QualifiedName}Schedule${type}Item.Schedule"
      name="pattern"/>
  </Columns>
  <DisplayName><![CDATA[pattern.DisplayName]]></DisplayName>
</Entity>