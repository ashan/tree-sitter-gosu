<%
uses gw.apd.model.generate.templates.TemplateComparators
uses gw.apd.util.APDStringUtil
%>
<%@ params(product : APDProduct, uwCompanyPubID : String) %>
<%for (jurisdiction in Jurisdiction.AllTypeKeys.toTypedArray().sort(TemplateComparators.TypekeyOrdering) index i) {%>
  <LicensedState
    public-id="${APDStringUtil.makePublicId({product.CodeIdentifier, ":"+jurisdiction.Code})}">
    <EffectiveDate><![CDATA[2000-01-01 00:00:00.000]]></EffectiveDate>
    <ExpirationDate/>
    <PriceFactor><![CDATA[0.90]]></PriceFactor>
    <ProductCode><![CDATA[${product.CodeIdentifier}]]></ProductCode>
    <Segment><![CDATA[low]]></Segment>
    <State><![CDATA[${jurisdiction.Code}]]></State>
    <UWCompany
      public-id="${uwCompanyPubID}"/>
  </LicensedState>
<%}%>