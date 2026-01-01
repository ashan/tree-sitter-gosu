<%@ params(productLine:APDProductLine) %>
<?xml version="1.0"?>
<Entity
  name="${productLine.LinePrefix}Transaction">
  <Columns>
    <Column
      beanPath="${productLine.LinePrefix}Transaction.Cost"
      name="cost"/>
  </Columns>
  <DisplayName><![CDATA[cost]]></DisplayName>
</Entity>

