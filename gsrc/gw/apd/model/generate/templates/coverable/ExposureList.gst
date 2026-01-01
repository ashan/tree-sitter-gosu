<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@params(parent:APDCoverable, exposure:APDExposure)%>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <PanelSet
    id="${parent.LinePrefix + exposure.TypeName}ListPanelSet">
    <Require
      name="${parent.TypeName.uncapitalize()}"
      type="entity.${parent.LinePrefix+parent.TypeName}"/>
    <Require
      name="jobWizardHelper"
      type="gw.api.web.job.JobWizardHelper"/>
    <DetailViewPanel>
      <InputColumn>
        <ListViewInput
          labelAbove="true">
          <Toolbar>
            <IteratorButtons
              iterator="${parent.LinePrefix+exposure.TypeName}LV"/>
          </Toolbar>
          <ListViewPanel>
            <RowIterator
              editable="true"
              elementName="${exposure.TypeName.uncapitalize()}"
              hideCheckBoxesIfReadOnly="true"
              id="${parent.LinePrefix+exposure.TypeName}LV"
              toCreateAndAdd="${parent.TypeName.uncapitalize()}.createAndAdd${parent.LinePrefix+exposure.TypeName}()"
              toRemove="${parent.TypeName.uncapitalize()}.remove${parent.LinePrefix+exposure.TypeName}(${exposure.TypeName.uncapitalize()})"
              value="${parent.TypeName.uncapitalize()}.${parent.LinePrefix+exposure.TypeName}s"
              valueType="entity.${parent.LinePrefix+exposure.TypeName}[]">
              <Row>
<% for (field in exposure.Fields.sort(TemplateComparators.AttributeOrdering) index i) {
var displaykey = "Web.Policy.${parent.LinePrefix}.${parent.LinePrefix+exposure.TypeName}.${field.Name}"
var canEdit = "true"%>
${Cell.renderToString(exposure.TypeName.uncapitalize(), field, displaykey, canEdit, null, true)}
<%}%>
              </Row>
            </RowIterator>
          </ListViewPanel>
        </ListViewInput>
      </InputColumn>
    </DetailViewPanel>
  </PanelSet>
</PCF>