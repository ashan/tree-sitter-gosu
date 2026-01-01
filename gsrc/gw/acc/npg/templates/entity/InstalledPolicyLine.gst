<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine:ProductLine) %>
<?xml version="1.0"?>
<typelistextension
  xmlns="http://guidewire.com/typelists"
  name="${productLine.InstalledPolicyLineName}">
    <typecode code="${productLine.Abbrevation}" desc="${productLine.EntityDisplayName}" name="${productLine.LineCode}"/>
</typelistextension>