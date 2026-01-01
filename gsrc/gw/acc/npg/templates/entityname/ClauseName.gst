<%@ params( entityName: String) %>
<?xml version="1.0"?>
<Entity
  name="${entityName}">
  <Columns>
    <Column
      beanPath="${entityName}.Pattern"
      name="pattern"/>
  </Columns>
  <DisplayName><![CDATA[pattern]]></DisplayName>
</Entity>

