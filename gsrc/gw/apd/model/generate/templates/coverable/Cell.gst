<%@ params(owner : String, field: APDAttribute, labelDisplayKey : String,
           editable : String, action : String, isExposure : boolean) %>
<%
var apdRulesHelper = "gw.web.rules.APDRulesHelper"
var argumentList = "${owner}.PolicyLine, ${owner}, ${owner}#${field.Name}.PropertyInfo"

var editableAttribute = editable
if (isExposure) {
  editableAttribute = (editable == "false"
    ? "false"
    : (editable == "true" ? "" : "${editable} and ") + "${apdRulesHelper}.isEditable(${argumentList})")
}
var valueVisibleAttribute = "${apdRulesHelper}.isVisible(${argumentList})"
var disablePostOnEnterAttribute = "not ${apdRulesHelper}.hasDependents(${argumentList})"
var onChangeAttribute = "${apdRulesHelper}.onChange(${owner}, jobWizardHelper)"
var filterAttribute = field.Type == APDFieldType.TC_TYPEKEY
  ? "${apdRulesHelper}.filterTypeKeys&lt;typekey.${field.TypelistToUse}&gt;(${argumentList}, VALUES)"
  : ""
%>
<% /* Boolean */ %>
<%if(field.Type== APDFieldType.TC_BOOLEAN){%>
        <BooleanRadioCell
<%if (action != null) {%>
          action="${action}"
<%}%>
          editable="${editableAttribute}"
          id="${field.Name}"
<%if (labelDisplayKey != null) {%>
          label="DisplayKey.get(&quot;${labelDisplayKey}&quot;)"
<%}%>
          value="${owner}.${field.Name}"
<%if (!isExposure) {%>
          valueVisible="${valueVisibleAttribute}"/>
<%} else {%>
          valueVisible="${valueVisibleAttribute}">
          <PostOnChange
            disablePostOnEnter="${disablePostOnEnterAttribute}"
            onChange="${onChangeAttribute}"/>
        </BooleanRadioCell>
<%}%>
<% /* Date */ %>
<%}else if(field.Type == APDFieldType.TC_DATE){%>
        <DateCell
<%if (action != null) {%>
          action="${action}"
<%}%>
          editable="${editableAttribute}"
          id="${field.Name}"
<%if (labelDisplayKey != null) {%>
          label="DisplayKey.get(&quot;${labelDisplayKey}&quot;)"
<%}%>
<%if (editableAttribute != "false") {%>
          validationExpression="${apdRulesHelper}.validateDateValueInRange(${argumentList}, ${owner}.${field.Name})"
<%}%>
          value="${owner}.${field.Name}"
<%if (!isExposure) {%>
          valueVisible="${valueVisibleAttribute}"/>
<%} else {%>
          valueVisible="${valueVisibleAttribute}">
          <PostOnChange
            disablePostOnEnter="${disablePostOnEnterAttribute}"
            onChange="${onChangeAttribute}"/>
        </DateCell>
<%}%>
<% /* Decimal */ %>
<%}else if(field.Type == APDFieldType.TC_BIGDECIMAL){%>
        <TextCell
<%if (action != null) {%>
          action="${action}"
<%}%>
          editable="${editableAttribute}"
          id="${field.Name}"
<%if (labelDisplayKey != null) {%>
          label="DisplayKey.get(&quot;${labelDisplayKey}&quot;)"
<%}%>
<%if (editableAttribute != "false") {%>
          validationExpression="${apdRulesHelper}.validateDecimalValueInRange(${argumentList}, ${owner}.${field.Name})"
<%}%>
          value="${owner}.${field.Name}"
          valueType="java.math.BigDecimal"
<%if (!isExposure) {%>
          valueVisible="${valueVisibleAttribute}"/>
<%} else {%>
          valueVisible="${valueVisibleAttribute}">
          <PostOnChange
            disablePostOnEnter="${disablePostOnEnterAttribute}"
            onChange="${onChangeAttribute}"/>
        </TextCell>
<%}%>
<% /* Location */ %>
<%}else if(field.Type == APDFieldType.TC_LOCATION){%>
        <RangeCell
<%if (action != null) {%>
          action="${action}"
<%}%>
          align="left"
          editable="${editableAttribute}"
          id="${field.Name}"
<%if (labelDisplayKey != null) {%>
          label="DisplayKey.get(&quot;${labelDisplayKey}&quot;)"
<%}%>
          optionLabel="${owner}.Branch.getPolicyLocationOptionDisplayName(VALUE)"
          value="${owner}.Account${field.Name}"
          valueRange="${owner}.Branch.Policy.Account.AccountLocations"
          valueType="AccountLocation"
          valueVisible="${valueVisibleAttribute}">
<%if (isExposure) {%>
          <PostOnChange
            disablePostOnEnter="${disablePostOnEnterAttribute}"
            onChange="${onChangeAttribute}"/>
<%}%>
          <PickerMenuItem
            action="LocationPopup.push(null, null, ${owner}.Branch, true, true, true)"
            id="New${field.Name}"
            label="DisplayKey.get(&quot;Web.Policy.LocationContainer.Location.New&quot;)"
            onPick="${owner}.${field.Name} = PickedValue"/>
          <PickerMenuItem
            action="LocationPopup.push(null, ${owner}.${field.Name}, ${owner}.Branch, true, true, true)"
            id="Edit${field.Name}"
            label="DisplayKey.get(&quot;Web.Policy.LocationContainer.Location.EditLocation&quot;)"
            onPick="${owner}.${field.Name} = PickedValue"
            visible="${owner}.${field.Name} != null"/>
        </RangeCell>
<% /* Integer */ %>
<%}else if(field.Type == APDFieldType.TC_INTEGER){%>
        <TextCell
<%if (action != null) {%>
          action="${action}"
<%}%>
          editable="${editableAttribute}"
          id="${field.Name}"
<%if (labelDisplayKey != null) {%>
          label="DisplayKey.get(&quot;${labelDisplayKey}&quot;)"
<%}%>
<%if (editableAttribute != "false") {%>
          validationExpression="${apdRulesHelper}.validateIntegerValueInRange(${argumentList}, ${owner}.${field.Name})"
<%}%>
          value="${owner}.${field.Name}"
          valueType="Integer"
<%if (!isExposure) {%>
          valueVisible="${valueVisibleAttribute}"/>
<%} else {%>
          valueVisible="${valueVisibleAttribute}">
          <PostOnChange
            disablePostOnEnter="${disablePostOnEnterAttribute}"
            onChange="${onChangeAttribute}"/>
        </TextCell>
<%}%>
<% /* Money */ %>
<%}else if(field.Type== APDFieldType.TC_MONEY){%>
        <TextCell
<%if (action != null) {%>
          action="${action}"
<%}%>
          editable="${editableAttribute}"
          id="${field.Name}"
<%if (labelDisplayKey != null) {%>
          label="DisplayKey.get(&quot;${labelDisplayKey}&quot;)"
<%}%>
<%if (editableAttribute != "false") {%>
          validationExpression="${apdRulesHelper}.validateMoneyValueInRange(${argumentList}, ${owner}.${field.Name})"
<%}%>
          value="${owner}.${field.Name}"
          valueType="java.math.BigDecimal"
<%if (!isExposure) {%>
          valueVisible="${valueVisibleAttribute}"/>
<%} else {%>
          valueVisible="${valueVisibleAttribute}">
          <PostOnChange
            disablePostOnEnter="${disablePostOnEnterAttribute}"
            onChange="${onChangeAttribute}"/>
        </TextCell>
<%}%>
<% /* Party */ %>
<%}else if(field.Type== APDFieldType.TC_PARTY){%>
        <RangeCell
<%if (action != null) {%>
          action="${action}"
<%}%>
          align="left"
          editable="${editableAttribute}"
          id="${field.Name}"
<%if (labelDisplayKey != null) {%>
          label="DisplayKey.get(&quot;${labelDisplayKey}&quot;)"
<%}%>
          value="${owner}.${field.Name}"
          valueRange="${owner}.Branch.PolicyContactRoles.whereTypeIs(APDPolicyInvolvedParty)"
          valueType="PolicyContactRole"
          valueVisible="${valueVisibleAttribute}">
          <PostOnChange
            disablePostOnEnter="${disablePostOnEnterAttribute}"
            onChange="${onChangeAttribute}"/>
            <PickerMenuItem
                onPick="${owner}.${field.Name} = ${owner}.Branch.addNewPolicyContactRoleForContact(PickedValue, TC_APDPOLICYINVOLVEDPARTY)"
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
                  onPick="${owner}.${field.Name} = PickedValue"/>
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
                    action="${owner}.${field.Name} = ${owner}.PolicyLine.addNewAPDPolicyInvolvedPartyForContact(availableInvolvedParty.AccountContact.Contact)"
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
                    action="${owner}.${field.Name} = ${owner}.PolicyLine.addNewAPDPolicyInvolvedPartyForContact(availableContact.AccountContact.Contact)"
                    id="OtherContact"
                    label="availableContact.DisplayName"/>
                </MenuItemIterator>
              </MenuItem>
          </RangeCell>
<% /* Typekey */ %>
<%}else if(field.Type== APDFieldType.TC_TYPEKEY){%>
        <TypeKeyCell
<%if (action != null) {%>
          action="${action}"
<%}%>
          editable="${editableAttribute}"
<%if (editableAttribute != "false") {%>
          filter="${filterAttribute}"
<%}%>
          id="${field.Name}"
<%if (labelDisplayKey != null) {%>
          label="DisplayKey.get(&quot;${labelDisplayKey}&quot;)"
<%}%>
          value="${owner}.${field.Name}"
          valueType="typekey.${field.TypelistToUse}"
<%if (!isExposure) {%>
          valueVisible="${valueVisibleAttribute}"/>
<%} else {%>
          valueVisible="${valueVisibleAttribute}">
          <PostOnChange
            disablePostOnEnter="${disablePostOnEnterAttribute}"
            onChange="${onChangeAttribute}"/>
        </TypeKeyCell>
<%}%>
<% /* Text */ %>
<%}else if(field.Type== APDFieldType.TC_VARCHAR){%>
        <TextCell
<%if (action != null) {%>
          action="${action}"
<%}%>
          editable="${editableAttribute}"
          id="${field.Name}"
<%if (labelDisplayKey != null) {%>
          label="DisplayKey.get(&quot;${labelDisplayKey}&quot;)"
<%}%>
          value="${owner}.${field.Name}"
          valueType="String"
<%if (!isExposure) {%>
          valueVisible="${valueVisibleAttribute}"/>
<%} else {%>
          valueVisible="${valueVisibleAttribute}">
          <PostOnChange
            disablePostOnEnter="${disablePostOnEnterAttribute}"
            onChange="${onChangeAttribute}"/>
        </TextCell>
<%}%>
<%}%>
