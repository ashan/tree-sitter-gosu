<%
uses gw.apd.model.generate.templates.TemplateComparators
uses gw.apd.model.generate.templates.coverable.CoverableDiffTree%>
<%@ params(product:APDProduct) %>
<DiffTree
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="schema/difftree.xsd">
  <Section
    label="gw.api.locale.DisplayKey.get('Web.Differences.LOB.Common.PolicyInfo')"
    sortorder="1">
    <RootProperties
      includefromtype="PolicyPeriod"
      sortorder="1"/>
    <RootEntity
      label="gw.api.locale.DisplayKey.get('Web.Differences.LOB.Common.PolicyPriNamedInsured', ENTITY.DisplayName)"
      sortorder="2"
      type="PolicyPriNamedInsured"/>
    <RootEntity
      label="gw.api.locale.DisplayKey.get('Web.Differences.LOB.Common.PolicyAddlNamedInsured', ENTITY.DisplayName)"
      sortorder="3"
      type="PolicyAddlNamedInsured"/>
    <RootEntity
      label="gw.api.locale.DisplayKey.get('Web.Differences.LOB.Common.PolicyAddlInterest', ENTITY.DisplayName)"
      showadds="false"
      showremoves="false"
      sortorder="4"
      type="PolicyAddlInterest"/>
    <RootEntity
      label="gw.api.locale.DisplayKey.get('Web.Differences.LOB.Common.PolicyBillingContact', ENTITY.DisplayName)"
      sortorder="5"
      type="PolicyBillingContact"/>
    <RootEntity
      label="gw.api.locale.DisplayKey.get('Web.Differences.LOB.Common.PolicyAddress', ENTITY.AddressType)"
      sortorder="6"
      type="PolicyAddress"/>
    <RootProperties
      includefromtype="EffectiveDatedFields"
      sortorder="7"/>
  </Section>
<%for (line in product.ProductLines*.ProductLine.sort(TemplateComparators.CoverableOrdering) index i) {%>
  <Section
    label="gw.api.locale.DisplayKey.get('Web.Differences.LOB.${line.LinePrefix}.Section')"
    sortorder="${i+2}">
${CoverableDiffTree.renderToString(line)}
<%for (child in line.AllChildCoverables.sort(TemplateComparators.CoverableOrdering) index j)  {%>
    <Section
      label="gw.api.locale.DisplayKey.get('Web.Differences.LOB.${child.LinePrefix}.${child.TypeName}.SubSection')"
      sortorder="${line.Exposures.Count + 5 + j}">
${CoverableDiffTree.renderToString(child)}
    </Section>
<%}%>
  </Section>
<%}%>
<% if (product.ProductLines*.ProductLine.hasMatch(\pl -> pl.HasModifiers) or product.ProductLines*.ProductLine*.ChildCoverables.hasMatch(\c -> c.HasModifiers)) {%>
  <Section
    label="gw.api.locale.DisplayKey.get('Web.Differences.LOB.Common.Modifiers')"
    sortorder="${product.ProductLines.Count}+2">
<%for (line in product.ProductLines*.ProductLine.sort(TemplateComparators.CoverableOrdering) index i) {%>
<%if (line.HasModifiers) {%>}
    <RootEntity
      type="entity.${line.LinePrefix}${line.TypeName}Modifier">
    </RootEntity>
<%}%>
<%for (cbl in line.AllChildCoverables.where(\cbl -> cbl.HasModifiers).sort(TemplateComparators.CoverableOrdering)) { %>
    <RootEntity
      type="entity.${cbl.LinePrefix}${cbl.TypeName}Modifier">
    </RootEntity>
<%}%>
<%}%>
  </Section>
<%}%>
</DiffTree>