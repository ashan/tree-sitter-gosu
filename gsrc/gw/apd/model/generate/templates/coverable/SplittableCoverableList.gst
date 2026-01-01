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
            <CheckedValuesToolbarButton
              allCheckedRowsAction="SplitRiskPopup.push(CheckedValues.toList())"
              hideIfReadOnly="true"
              id="Split"
              iterator="${parent.LinePrefix+coverable.TypeName}LV"
              label="DisplayKey.get(&quot;Web.Job.Coverable.Split&quot;)"/>
          </Toolbar>
          <ListViewPanel>
            <RowIterator
              editable="true"
              elementName="${coverable.TypeName.uncapitalize()}"
              hasCheckBoxes="true"
              hideCheckBoxesIfReadOnly="true"
              id="${parent.LinePrefix + coverable.TypeName}LV"
              toRemove="${parent.TypeName.uncapitalize()}.removeWM()"
              value="${parent.TypeName.uncapitalize()}.${coverable.LinePrefix+coverable.TypeName}sInPeriod"
              valueType="entity.${coverable.LinePrefix+coverable.TypeName}[]">
              <!-- The first row shows the first split of the coverable -->
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
                <DateCell
                  editable="false"
                  id="EffectiveDate"
                  label="DisplayKey.get(&quot;Web.Job.Coverable.EffectiveDate&quot;)"
                  value="${coverable.TypeName.uncapitalize()}.EffectiveDate"/>
                <DateCell
                  editable="false"
                  id="ExpirationDate"
                  label="DisplayKey.get(&quot;Web.Job.Coverable.ExpirationDate&quot;)"
                  value="${coverable.TypeName.uncapitalize()}.ExpirationDate"/>
<% for (field in coverable.Fields.where(\f -> f.Identifier).sort(TemplateComparators.AttributeOrdering) index i) {
var action = (i == 0) ? "${coverable.LinePrefix+coverable.TypeName}Popup.push(${coverable.TypeName.uncapitalize()}, canEdit, jobWizardHelper)" : null
var displaykey = "Web.Policy.${coverable.LinePrefix}.${coverable.LinePrefix+coverable.TypeName}.${field.Name}"
var canEdit = "false"%>
${Cell.renderToString(coverable.TypeName.uncapitalize(), field, displaykey, canEdit, action, false)}
<%}%>
              </Row>
              <!-- Additional rows show additional splits of the coverable -->
              <RowIterator
                editable="true"
                elementName="${coverable.TypeName.uncapitalize()}Version"
                id="${parent.LinePrefix + coverable.TypeName}VersionsLV"
                pageSize="0"
                value="${coverable.TypeName.uncapitalize()}.AdditionalVersions.cast(entity.${coverable.LinePrefix+coverable.TypeName})"
                valueType="entity.${coverable.LinePrefix+coverable.TypeName}[]">
                <Row>
<% if(coverable.AutoNumber) {%>
                  <EmptyCell
                    id="SeqNum"/>
<%}%>
                  <DateCell
                    editable="false"
                    id="EffectiveDate"
                    value="${coverable.TypeName.uncapitalize()}Version.EffectiveDate"/>
                  <DateCell
                    editable="false"
                    id="ExpirationDate"
                    value="${coverable.TypeName.uncapitalize()}Version.ExpirationDate"/>
<% for (field in coverable.Fields.where(\f -> f.Identifier).sort(TemplateComparators.AttributeOrdering) index i) {
var action = (i == 0) ? "${coverable.LinePrefix+coverable.TypeName}Popup.push(${coverable.TypeName.uncapitalize() + "Version"}, canEdit, jobWizardHelper)" : null
var canEdit = "false"%>
${Cell.renderToString(coverable.TypeName.uncapitalize() + "Version", field, null, canEdit, action, false)}
<%}%>
                </Row>
              </RowIterator>
            </RowIterator>
          </ListViewPanel>
        </ListViewInput>
      </InputColumn>
    </DetailViewPanel>
  </PanelSet>
</PCF>