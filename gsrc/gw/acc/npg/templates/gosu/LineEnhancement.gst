<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine:ProductLine) %>
package ${productLine.LOBPackageName}

enhancement ${productLine.EnhancementName}: entity.${productLine.EntityName} {

<%for(var coverable in productLine.Coverables){%>
  function createAndAdd${coverable.EntityNameWithoutSuffix}(): ${coverable.EntityName} {
    var cbl = new ${coverable.EntityName}(this.Branch)
    this.addTo${coverable.ReferenceName}(cbl)
<%if(coverable.IsAutoNumbered){%>
    this.${coverable.asAutoNumberFkField().Name}.number(cbl, this.${coverable.ReferenceName}, ${coverable.EntityName}.Type.TypeInfo.getProperty("${coverable.AutoNumberFieldName}"))
<%}%>
<%if(coverable.AttachToLocation){%>
    if (this.Branch.PrimaryLocation != null) {
      cbl.${coverable.LocationFkField.Name} = this.Branch.PrimaryLocation
    }
<%}%>
<%if(coverable.IncludeModifier){%>
    cbl.syncModifiers()
<%}%>
    cbl.syncCoverages()
    return cbl
  }

  function remove${coverable.EntityNameWithoutSuffix}(cbl: ${coverable.EntityName}) {
    this.removeFrom${coverable.ReferenceName}( cbl )
  }
<%}%>
}