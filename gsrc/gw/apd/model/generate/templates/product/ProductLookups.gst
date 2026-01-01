<% uses gw.apd.util.APDStringUtil %>
<%@ params(product: APDProduct) %>
<% var productCode = product.CodeIdentifier %>
<?xml version="1.0"?>
<import>
  <ProductLookup public-id="${APDStringUtil.makeCodeIdentifier(productCode)}">
    <Availability>Available</Availability>
    <ProductCode>${productCode}</ProductCode>
    <StartEffectiveDate>2000-01-01 00:00:00.000</StartEffectiveDate>
  </ProductLookup>
</import>

