<%@params(
        owner : String, field : APDAttribute,
        labelDisplayKey : String, editable : String, action : String, required : String,
        isCoverable : boolean, childArrayPropertyName : String, childArrayHasIdentifiers : boolean
)%>
<%
var APDRulesHelper = "gw.web.rules.APDRulesHelper"
var propertyName = field.Name

var argumentList = "${owner}.PolicyLine, ${owner}, ${owner}#${propertyName}.PropertyInfo"

var editableAttrValue = (editable != "true" ? "${editable} and " : "") + "${APDRulesHelper}.isEditable(${argumentList})"
var disablePostOnEnterAttrValue = "not ${APDRulesHelper}.hasDependents(${argumentList})"

// onChange script for the entity
var onChangeForEntity = "${APDRulesHelper}.onChange(${owner}, jobWizardHelper)"

// onChange script for the child array
var onChangeForChildArray = ""
if (childArrayPropertyName.HasContent) {
  var onChangeArgListChildArray = "${owner}.${childArrayPropertyName}"
  if (childArrayHasIdentifiers) {
    onChangeArgListChildArray = onChangeArgListChildArray + ", ${owner}.${childArrayPropertyName}?.first().IdentifierPropertyList"
  }
  onChangeForChildArray = "; ${APDRulesHelper}.onChange(${onChangeArgListChildArray}, jobWizardHelper)"
}

var onChangeAttrValue = onChangeForEntity + onChangeForChildArray

var widgetType = ""
switch (field.Type) {
  case APDFieldType.TC_BOOLEAN:
    widgetType = "BooleanRadio"
    break
  case APDFieldType.TC_DATE:
    widgetType = "Date"
    break
  case APDFieldType.TC_TYPEKEY:
    widgetType = "TypeKey"
    break
  case APDFieldType.TC_BIGDECIMAL:
  case APDFieldType.TC_INTEGER:
  case APDFieldType.TC_MONEY:
  case APDFieldType.TC_VARCHAR:
    widgetType = "Text"
    break
}

// remove the extra new line at the end TypeInput produced
var output = widgetType != ""
  ? TypeInput.renderToString(
        widgetType, owner, field,
        labelDisplayKey, action, required,
        editableAttrValue, disablePostOnEnterAttrValue, onChangeAttrValue,
        argumentList
    ).replaceFirst("\\s++$", "")
  : null
%>
<%if (output != null) {%>
${output}
<%} else if (field.Type == APDFieldType.TC_LOCATION) {%>
            <InputSet>
              <Variable
                initialValue="${editableAttrValue}"
                name="isEditable"
                recalculateOnRefresh="true"
                type="Boolean"/>
              <Variable
                initialValue="${APDRulesHelper}.isVisible(${argumentList})"
                name="isVisible"
                recalculateOnRefresh="true"
                type="Boolean"/>
              <RangeInput
<%if (action != null) {%>
                action="${action}"
<%}%>
                editable="isEditable"
                align="left"
                id="${propertyName}"
                label="DisplayKey.get(&quot;${labelDisplayKey}&quot;)"
                optionLabel="${owner}.Branch.getPolicyLocationOptionDisplayName(VALUE)"
<%if (required != null) {%>
                required="${required}"
<%}%>
                value="${owner}.Account${propertyName}"
                valueRange="${owner}.Branch.Policy.Account.AccountLocations"
                valueType="AccountLocation"
                visible="isVisible">
                <PostOnChange
                  disablePostOnEnter="${disablePostOnEnterAttrValue}"
                  onChange="${onChangeAttrValue}"/>
                <PickerMenuItem
                  action="LocationPopup.push(null, null, ${owner}.Branch, true, true, true)"
                  id="New${propertyName}"
                  label="DisplayKey.get(&quot;Web.Policy.LocationContainer.Location.New&quot;)"
                  onPick="${owner}.${propertyName} = PickedValue"/>
                <PickerMenuItem
                  action="LocationPopup.push(null, ${owner}.${propertyName}, ${owner}.Branch, true, true, true)"
                  id="Edit${propertyName}"
                  label="DisplayKey.get(&quot;Web.Policy.LocationContainer.Location.EditLocation&quot;)"
                  onPick="${owner}.${propertyName} = PickedValue"
                  visible="${owner}.${propertyName} != null"/>
              </RangeInput>
            </InputSet>
<%} else if (field.Type == APDFieldType.TC_PARTY) {%>
            <InputSet>
              <Variable
                initialValue="${editableAttrValue}"
                name="isEditable"
                recalculateOnRefresh="true"
                type="Boolean"/>
              <Variable
                initialValue="${APDRulesHelper}.isVisible(${argumentList})"
                name="isVisible"
                recalculateOnRefresh="true"
                type="Boolean"/>
              <RangeInput
<%if (action != null) {%>
                action="${action}"
<%}%>
                align="left"
                editable="isEditable"
                id="${propertyName}"
                label="DisplayKey.get(&quot;${labelDisplayKey}&quot;)"
<%if (required != null) {%>
                required="${required}"
<%}%>
                value="${owner}.${propertyName}"
                valueRange="${owner}.Branch.PolicyContactRoles.whereTypeIs(APDPolicyInvolvedParty)"
                valueType="PolicyContactRole"
                visible="isVisible">
                <PostOnChange
                  disablePostOnEnter="${disablePostOnEnterAttrValue}"
                  onChange="${onChangeAttrValue}"/>
                <PickerMenuItem
                  onPick="${owner}.${propertyName} = ${owner}.Branch.addNewPolicyContactRoleForContact(PickedValue, TC_APDPOLICYINVOLVEDPARTY)"
                  id="AddFromSearch"
                  label="DisplayKey.get(&quot;Web.Policy.Contact.FromAddressBook&quot;)"
                  action="ContactSearchPopup.push(TC_APDINVOLVEDPARTY)"/>
                <MenuItemIterator
                  elementName="contactType"
                  value="gw.plugin.Plugins.get(gw.plugin.contact.IContactConfigPlugin).getAllowedContactTypesForPolicyContactRoleType(TC_APDPOLICYINVOLVEDPARTY)"
                  valueType="typekey.ContactType[]">
                  <IteratorSort
                    sortBy="contactType.DisplayName"
                    sortOrder="1"/>
                  <PickerMenuItem
                    id="ContactType"
                    label="DisplayKey.get(&quot;Web.Contact.AddNewOfType&quot;, contactType)"
                    action="NewAPDPolicyInvolvedPartyPopup.push(${owner}.PolicyLine,contactType)"
                    onPick="${owner}.${propertyName} = PickedValue"/>
                </MenuItemIterator>
                <MenuItem
                  id="existingInvolvedParties"
                  label="DisplayKey.get(&quot;Web.Policy.Contact.AddExisting&quot;,APDPolicyInvolvedParty.Type.TypeInfo.DisplayName)">
                  <MenuItemIterator
                    elementName="availableInvolvedParty"
                    id="AddOtherInvolvedParty"
                    value="${owner}.Branch.UnassignedAPDInvolvedParties"
                    valueType="entity.AccountContactView[]">
                    <MenuItem
                      action="${owner}.${propertyName} = ${owner}.PolicyLine.addNewAPDPolicyInvolvedPartyForContact(availableInvolvedParty.AccountContact.Contact)"
                      id="OtherInvolvedParty"
                      label="availableInvolvedParty.DisplayName"/>
                  </MenuItemIterator>
                </MenuItem>
                <MenuItem
                  id="availableContacts"
                  label="DisplayKey.get(&quot;Web.Policy.Contact.AddOtherContacts&quot;)">
                  <MenuItemIterator
                    elementName="availableContact"
                    id="AddOtherContact"
                    value="${owner}.Branch.APDInvolvedPartyOtherCandidates"
                    valueType="entity.AccountContactView[]">
                    <MenuItem
                      action="${owner}.${propertyName} = ${owner}.PolicyLine.addNewAPDPolicyInvolvedPartyForContact(availableContact.AccountContact.Contact)"
                      id="OtherContact"
                      label="availableContact.DisplayName"/>
                  </MenuItemIterator>
                </MenuItem>
              </RangeInput>
            </InputSet>
<%}%>