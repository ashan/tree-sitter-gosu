<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@params(parent:APDCoverable, coverable:APDCoverable)%>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <PanelSet
    id="${coverable.LinePrefix + coverable.TypeName}ListPanelSet">
    <Require
      name="${parent.TypeName.uncapitalize()}"
      type="entity.${parent.LinePrefix + parent.TypeName}"/>
    <Require
      name="canEdit"
      type="boolean"/>
    <Require
      name="jobWizardHelper"
      type="gw.api.web.job.JobWizardHelper"/>
    <DetailViewPanel>
      <InputColumn>
        <ListViewInput
          labelAbove="true">
          <Toolbar>
            <ToolbarButton
              action="${coverable.LinePrefix+coverable.TypeName}Popup.push(${parent.TypeName.uncapitalize()}, canEdit, jobWizardHelper)"
              hideIfReadOnly="true"
              id="Add${coverable.TypeName}"
              label="DisplayKey.get(&quot;Button.Add&quot;)"/>
            <IteratorButtons
              iterator="${coverable.LinePrefix+coverable.TypeName}LV"/>
          </Toolbar>
          <ListViewPanel>
            <RowIterator
              editable="true"
              elementName="${coverable.TypeName.uncapitalize()}"
              hideCheckBoxesIfReadOnly="true"
              id="${parent.LinePrefix + coverable.TypeName}LV"
              toRemove="${parent.TypeName.uncapitalize()}.remove${coverable.LinePrefix+coverable.TypeName}(${coverable.TypeName.uncapitalize()})"
              value="${parent.TypeName.uncapitalize()}.${coverable.LinePrefix+coverable.TypeName}s"
              valueType="entity.${coverable.LinePrefix+coverable.TypeName}[]">
              <Row>
              <% if(coverable.AutoNumber) {%>
              <TextCell
                align="left"
                id="SeqNum"
                label="DisplayKey.get(&quot;Web.Policy.${coverable.LinePrefix}.${coverable.LinePrefix+coverable.TypeName}.Number&quot;)"
                sortOrder="1"
                value="${coverable.TypeName.uncapitalize()}.SequenceNumber"
                valueType="java.lang.Integer"/>
                <%}%>
<% for (field in coverable.Fields.where(\f -> f.Identifier).sort(TemplateComparators.AttributeOrdering) index i) {
var action = (i == 0) ? "${coverable.LinePrefix+coverable.TypeName}Popup.push(${coverable.TypeName.uncapitalize()}, canEdit, jobWizardHelper)" : null
var displaykey = "Web.Policy.${coverable.LinePrefix}.${coverable.LinePrefix+coverable.TypeName}.${field.Name}"
var canEdit = "false"%>
${Cell.renderToString(coverable.TypeName.uncapitalize(), field, displaykey, canEdit, action, false)}
<%}%>
              </Row>
            </RowIterator>
          </ListViewPanel>
        </ListViewInput>
      </InputColumn>
    </DetailViewPanel>
  </PanelSet>
</PCF>