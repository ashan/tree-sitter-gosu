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
            <CheckedValuesToolbarButton
              allCheckedRowsAction="SplitRiskPopup.push(CheckedValues.toList())"
              hideIfReadOnly="true"
              id="Split"
              iterator="${parent.LinePrefix+exposure.TypeName}LV"
              label="DisplayKey.get(&quot;Web.Job.Exposure.Split&quot;)"/>
          </Toolbar>
          <ListViewPanel>
            <RowIterator
              editable="true"
              elementName="${exposure.TypeName.uncapitalize()}"
              hasCheckBoxes="true"
              hideCheckBoxesIfReadOnly="true"
              id="${parent.LinePrefix+exposure.TypeName}LV"
              toCreateAndAdd="${parent.TypeName.uncapitalize()}.createAndAdd${parent.LinePrefix+exposure.TypeName}()"
              toRemove="${exposure.TypeName.uncapitalize()}.removeWM()"
              value="${parent.TypeName.uncapitalize()}.${parent.LinePrefix+exposure.TypeName}sInPeriod"
              valueType="entity.${parent.LinePrefix+exposure.TypeName}[]">
              <!-- The first row shows the first split of the exposure. All fields are editable. -->
              <Row>
                <DateCell
                  editable="false"
                  id="EffectiveDate"
                  label="DisplayKey.get(&quot;Web.Job.Exposure.EffectiveDate&quot;)"
                  value="${exposure.TypeName.uncapitalize()}.EffectiveDate"/>
                <DateCell
                  editable="false"
                  id="ExpirationDate"
                  label="DisplayKey.get(&quot;Web.Job.Exposure.ExpirationDate&quot;)"
                  value="${exposure.TypeName.uncapitalize()}.ExpirationDate"/>
<% for (field in exposure.Fields.sort(TemplateComparators.AttributeOrdering) index i) {
var displaykey = "Web.Policy.${parent.LinePrefix}.${parent.LinePrefix+exposure.TypeName}.${field.Name}"
var canEdit = "true"%>
${Cell.renderToString(exposure.TypeName.uncapitalize(), field, displaykey, canEdit, null, true)}
<%}%>
              </Row>
              <!-- Additional rows show additional splits of the exposure. Only splittable fields can be edited. -->
              <RowIterator
                editable="true"
                elementName="${exposure.TypeName.uncapitalize()}Version"
                id="${parent.LinePrefix+exposure.TypeName}VersionsLV"
                pageSize="0"
                value="${exposure.TypeName.uncapitalize()}.AdditionalVersions.cast(entity.${parent.LinePrefix+exposure.TypeName})"
                valueType="entity.${parent.LinePrefix+exposure.TypeName}[]">
                <Row>
                  <DateCell
                    editable="false"
                    id="EffectiveDate"
                    value="${exposure.TypeName.uncapitalize()}Version.EffectiveDate"/>
                  <DateCell
                    editable="false"
                    id="ExpirationDate"
                    value="${exposure.TypeName.uncapitalize()}Version.ExpirationDate"/>
<% for (field in exposure.Fields.sort(TemplateComparators.AttributeOrdering) index i) {
var canEdit = field.SplitByRatingPeriods.toString()%>
${Cell.renderToString(exposure.TypeName.uncapitalize() + "Version", field, null, canEdit, null, true)}
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