<%@ params( entityName: String) %>
<?xml version="1.0"?>
<Entity
  name="${entityName}">
  <Columns>
    <Column
      beanPath="${entityName}.Pattern.Name"
      name="name"
      sortOrder="1"/>
  </Columns>
  <DisplayName><![CDATA[name]]></DisplayName>
</Entity>

