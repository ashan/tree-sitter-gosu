<%@ params(productLine:APDProductLine, coverable:APDCoverable) %>
<?xml version="1.0"?>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <Page
    afterEnter="gw.api.web.PebblesUtil.addWebMessages(CurrentLocation, policyPeriod.PolicyFileMessages)"
    canVisit="perm.PolicyPeriod.view(policyPeriod) and perm.System.pfiledetails"
    id="PolicyFile_${coverable.LinePrefix.concat(coverable.TypeName)}"
    parent="${productLine.CodeIdentifier}Links(policyPeriod, asOfDate)"
    title="DisplayKey.get(&quot;Web.PolicyFile.${productLine.LinePrefix}.${productLine.LinePrefix.concat(coverable.TypeName)}&quot;)">
    <LocationEntryPoint
      signature="PolicyFile_${coverable.LinePrefix.concat(coverable.TypeName)}(policyPeriod : PolicyPeriod, asOfDate : java.util.Date)"/>
    <Variable
      name="policyPeriod"
      type="PolicyPeriod"/>
    <Variable
      name="asOfDate"
      type="java.util.Date"/>
    <ScreenRef
      def="PolicyFile_${coverable.LinePrefix + coverable.TypeName}Screen(policyPeriod.${productLine.CodeIdentifier})"
      id="PolicyFile_${coverable.LinePrefix + coverable.TypeName}Screen"/>
  </Page>

</PCF>