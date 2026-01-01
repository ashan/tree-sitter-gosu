<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants
uses gw.apd.model.generate.APDGosuReferencesHelper

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.lang.reflect.IPropertyInfo
uses gw.pl.persistence.core.Bundle

enhancement ${coverable.QualifiedName}Enhancement: entity.${coverable.QualifiedName} {
<%if (!coverable.IsACoverable) { // For coverables with clauses, this property is generated in CoverableAdapter.gst %>
  property get PolicyLine() : entity.PolicyLine {
    return this${APDGosuReferencesHelper.getReferenceToLine(coverable)}
  }
<%}%>

<%for(var child in coverable.ChildCoverables.sort(TemplateComparators.CoverableOrdering)){%>
  function createAndAdd${child.QualifiedName}(): entity.${child.QualifiedName} {
    var cbl = new entity.${child.LinePrefix+child.TypeName}(this.Branch)
    this.addTo${child.QualifiedName}s(cbl)
<%if(child.AutoNumber){%>
    this.${child.QualifiedName}AutoNumberSeq.number(cbl, CurrentAndFuture${child.QualifiedName}s, entity.${child.QualifiedName}.Type.TypeInfo.getProperty("SequenceNumber"))
<%}%>
<%for(var grandChild in child.ChildCoverables.sort(TemplateComparators.CoverableOrdering)){%>
<%if(grandChild.AutoNumber){%>
    cbl.initialize${grandChild.QualifiedName}AutoNumberSequence()
<%}%>
<%}%>
    cbl.initializeDefaultValuesAndSync()
<%if(child.Clauses.Count > 0) {%>
    cbl.createCoveragesConditionsAndExclusions()
<%}%>
<%if(child.HasModifiers){%>
    cbl.syncModifiers()
<%}%>
    return cbl
  }

<%if(child.AutoNumber){%>
  function initialize${child.QualifiedName}AutoNumberSequence() {
    this.${child.QualifiedName}AutoNumberSeq = new AutoNumberSequence(this.Bundle)
  }

  property get CurrentAndFuture${child.QualifiedName}s() :  entity.${child.QualifiedName}[] {
    var ${child.TypeName.uncapitalize()}s = this.${child.QualifiedName}s.toSet()
    this.Branch.OOSSlices.where(\p -> p.${child.ProductLine.CodeIdentifier}.${APDGosuReferencesHelper.getEfficientArrayReferenceFromLine(child)} != null)
                         .each(\p -> p.${child.ProductLine.CodeIdentifier}.${APDGosuReferencesHelper.getEfficientArrayReferenceFromLine(child)}
                         .each(\obj -> ${child.TypeName.uncapitalize()}s.add(obj)))
    return ${child.TypeName.uncapitalize()}s.toTypedArray()
  }

  function reset${child.QualifiedName}AutoNumberSequences() {
    this.${child.QualifiedName}AutoNumberSeq.reset()
    renumberAll${child.QualifiedName}AutoSequences()
  }

  function clone${child.QualifiedName}AutoNumberSequences(bundle : Bundle) {
    this.${child.QualifiedName}AutoNumberSeq.clone(bundle)
  }

  function bind${child.QualifiedName}AutoNumberSequences() {
    renumberAll${child.QualifiedName}AutoSequences()
    this.${child.QualifiedName}AutoNumberSeq.bind(CurrentAndFuture${child.QualifiedName}s, entity.${child.QualifiedName}.Type.TypeInfo.getProperty("SequenceNumber"))
  }

  function renumber${child.QualifiedName}AutoNumberSequences() {
    this.${child.QualifiedName}AutoNumberSeq.renumberNewBeans(CurrentAndFuture${child.QualifiedName}s, entity.${child.QualifiedName}.Type.TypeInfo.getProperty("SequenceNumber"))
  }

  private function renumberAll${child.QualifiedName}AutoSequences() {
    this.${child.QualifiedName}AutoNumberSeq.renumber(CurrentAndFuture${child.QualifiedName}s, entity.${child.QualifiedName}.Type.TypeInfo.getProperty("SequenceNumber"))
  }

<%}%>
  function remove${child.QualifiedName}(cbl: entity.${child.QualifiedName}) {
    this.removeFrom${child.QualifiedName}s(cbl)
<%if(child.AutoNumber){%>
    this.${child.QualifiedName}AutoNumberSeq.renumber(CurrentAndFuture${child.QualifiedName}s, entity.${child.QualifiedName}.Type.TypeInfo.getProperty("SequenceNumber"))
<%}%>
  }

<% if (child.HasSplittableFields) {%>
  property get ${child.QualifiedName}sInPeriod() : entity.${child.QualifiedName}[] {
    var firstVersions = this.VersionList.${child.QualifiedName}s.map(\versionList -> versionList.AllVersions.first())
    var slicedVersions = firstVersions.map(\coverable -> coverable.getSlice(coverable.EffectiveDate))
    return slicedVersions.toTypedArray()
  }

<%}%>
<%}%>
<%for(var exposure in coverable.Exposures.sort(TemplateComparators.ExposureOrdering)){%>
  function createAndAdd${exposure.QualifiedName}(): entity.${exposure.QualifiedName} {
    var cbl = new entity.${exposure.QualifiedName}(this.Branch)
    this.addTo${exposure.QualifiedName}s(cbl)
<%if(exposure.IsAutoNumbered){%>
    this.${exposure.QualifiedName}AutoNumberSeq.number(cbl, CurrentAndFuture${exposure.QualifiedName}s, entity.${exposure.QualifiedName}.Type.TypeInfo.getProperty("SequenceNumber"))
<%}%>
    cbl.initializeDefaultValuesAndSync()
    return cbl
  }

<%if(exposure.IsAutoNumbered){// to be completed%>
  property get CurrentAndFuture${exposure.QualifiedName}s() :  entity.${exposure.QualifiedName}[] {
    var ${exposure.TypeName}s = this.${exposure.QualifiedName}s.toList()
    this.Branch.OOSSlices.where(\p -> p.${coverable.ProductLine.QualifiedName}.${APDGosuReferencesHelper.getEfficientArrayReferenceFromLine(exposure)} != null)
                         .each(\p -> p.${coverable.ProductLine.QualifiedName}.${APDGosuReferencesHelper.getEfficientArrayReferenceFromLine(exposure)}
                         .each(\obj -> {
                           if (!${exposure.TypeName}s.contains(obj)) ${exposure.TypeName}s.add(obj)
                         }))
    return ${exposure.TypeName}s.toTypedArray()
  }

<%}%>
  function remove${exposure.QualifiedName}(cbl: entity.${exposure.QualifiedName}) {
    this.removeFrom${exposure.QualifiedName}s(cbl)
<%if(exposure.IsAutoNumbered){%>
    this.${exposure.QualifiedName}AutoNumberSeq.renumber(cbl, this.${exposure.QualifiedName}s, entity.${exposure.QualifiedName}.Type.TypeInfo.getProperty("${exposure.QualifiedName}Number"))
<%}%>
  }

<%if (exposure.HasSplittableFields) {%>
  property get All${exposure.QualifiedName}sWM() : List<entity.${exposure.QualifiedName}> {
    return this.VersionList.${exposure.QualifiedName}s.flatMap(\exp -> exp.AllVersions)
  }

  property get ${exposure.QualifiedName}sInPeriod() : entity.${exposure.QualifiedName}[] {
    var firstVersions = this.VersionList.${exposure.QualifiedName}s.map(\versionList -> versionList.AllVersions.first())
    var slicedVersions = firstVersions.map(\exposure -> exposure.getSlice(exposure.EffectiveDate))
    return slicedVersions.toTypedArray()
  }

<%}%>
<%}%>
<%if (coverable.ContainsSplittableAttribute) {%>
  /**
   * Ensures that all versions of this coverable have the same values for non-splittable fields. This method will
   * also synchronize any exposures and child coverables that have splittable fields.
   */
  function syncSplittableFields() {
<%if (coverable.HasSplittableFields) {%>
    var firstVersion = this.VersionList.AllVersions.first()
    for (additionalVersion in this.AdditionalVersions.cast(entity.${coverable.QualifiedName})) {
<%for (field in coverable.Fields.where(\field -> !field.SplitByRatingPeriods).sort(TemplateComparators.AttributeOrdering)) {%>
      additionalVersion.${field.Name} = firstVersion.${field.Name}<%if (field.Type == APDFieldType.TC_LOCATION or field.Type == APDFieldType.TC_PARTY){%>.Unsliced<%}%>
<%}%>
    }
<%}%>
<%for (child in coverable.ChildCoverables.where(\child -> child.ContainsSplittableAttribute).sort(TemplateComparators.CoverableOrdering)) {%>
<%if (child.HasSplittableFields) {%>
    for (${child.TypeName.toLowerCase()} in this.${child.QualifiedName}sInPeriod) {
<%} else {%>
    for (${child.TypeName.toLowerCase()} in this.${child.QualifiedName}s) {
<%}%>
      ${child.TypeName.toLowerCase()}.syncSplittableFields()
    }
<%}%>
<%for (exposure in coverable.Exposures.where(\exposure -> exposure.HasSplittableFields).sort(TemplateComparators.ExposureOrdering)) {%>
    for (${exposure.TypeName.toLowerCase()} in this.${exposure.QualifiedName}sInPeriod) {
      ${exposure.TypeName.toLowerCase()}.syncSplittableFields()
    }
<%}%>
  }

<%}%>
<% for (field in coverable.Fields.where(\f -> f.Type == APDFieldType.TC_LOCATION).sort(TemplateComparators.AttributeOrdering)) {%>
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
  property get IdentifierPropertyList() : List<IPropertyInfo> {
<%var identifierFields = coverable.Identifiers%>
<% if (identifierFields.HasElements) {
    var indent = "      "
    var formattedFieldList = identifierFields
        .map(\field -> indent + "this#" + field.Name + ".PropertyInfo")
        .join(",\n")
%>    return {
${formattedFieldList}
    }<%
   } else {
%>    return {}<%}%>
  }
}

