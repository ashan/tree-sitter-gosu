<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(exposure : APDExposure) %>
<%
uses gw.apd.APDConstants
uses gw.apd.model.generate.APDGosuReferencesHelper

var basePackage = "${APDConstants.GW_LOB}.${exposure.Coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

enhancement ${exposure.QualifiedName}Enhancement: entity.${exposure.QualifiedName} {
<%if (exposure.HasSplittableFields) {%>
  /**
   * Ensures that all versions of this exposure have the same values for non-splittable fields.
   */
   function syncSplittableFields() {
    var firstVersion = this.VersionList.AllVersions.first()
    for (additionalVersion in this.AdditionalVersions.cast(entity.${exposure.QualifiedName})) {
<%for (field in exposure.Fields.where(\field -> !field.SplitByRatingPeriods).sort(TemplateComparators.AttributeOrdering)) {%>
      additionalVersion.${field.Name} = firstVersion.${field.Name}<%if (field.Type == APDFieldType.TC_LOCATION or field.Type == APDFieldType.TC_PARTY){%>.Unsliced<%}%>
<%}%>
    }
  }

<%}%>
<% for (field in exposure.Fields.where(\f -> f.Type == APDFieldType.TC_LOCATION).sort(TemplateComparators.AttributeOrdering)) {%>
  /**
   * Gets the AccountLocation from the PolicyLocation
   */
  property get Account${field.Name}() : AccountLocation {
    return this.${field.Name}.AccountLocation
  }

  /**
   * Sets the AccountLocation and ensures that ${field.Name} is also set properly
   */
  property set Account${field.Name}(acctLoc : AccountLocation) {
    // See if there's already a PolicyLocation which points to the AccountLocation.
    // There should be at most one.
    var policyLocs = this.Branch.PolicyLocations.where(\ p -> p.AccountLocation == acctLoc)
    if (policyLocs.Count > 1) {
      throw "Expected only one PolicyLocation associated with the AccountLocation: " + acctLoc
    }
    var policyLoc = policyLocs.first()

    // Create a new PolicyLocation if neccessary
    if (policyLoc == null && acctLoc != null) {
      policyLoc = this.Branch.newLocation(acctLoc)
      for(var tc in policyLoc.TerritoryCodes)
        tc.fillWithFirst()
    }

    if (policyLoc != null) {
      this.${field.Name} = policyLoc
    }
  }
<%}%>

  property get PolicyLine() : entity.PolicyLine {
<%if (exposure.Coverable typeis APDProductLine) {%>
    return this.${exposure.Coverable.TypeName}
<%} else {%>
     return this.${exposure.Coverable.TypeName}.PolicyLine
<% } %>
  }
}

