<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine: ProductLine) %>
<DiffTree xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="schema/difftree.xsd">
  <Section label="displaykey.Web.Differences.LOB.Common.PolicyInfo" sortorder="1">
    <RootProperties includefromtype="PolicyPeriod" sortorder="1"/>
    <RootProperties includefromtype="EffectiveDatedFields" sortorder="2">
      <PropertyDisplay propertyname="OfferingCode" value="ENTITY.getOfferingName(VALUE)"/>
    </RootProperties>
    <RootEntity type="PolicyPriNamedInsured" label="displaykey.Web.Differences.LOB.Common.PolicyPriNamedInsured(ENTITY.DisplayName)" sortorder="3"/>
    <RootEntity type="PolicySecNamedInsured" label="displaykey.Web.Differences.LOB.Common.PolicySecNamedInsured(ENTITY.DisplayName)" sortorder="4"/>
    <RootEntity type="PolicyAddlInterest" showadds="false" showremoves="false" label="displaykey.Web.Differences.LOB.Common.PolicyAddlInterest(ENTITY.DisplayName)" sortorder="5"/>
    <RootEntity type="PolicyAddress" label="displaykey.Web.Differences.LOB.Common.PolicyAddress(ENTITY.AddressType)" sortorder="6"/>
  </Section>
</DiffTree>