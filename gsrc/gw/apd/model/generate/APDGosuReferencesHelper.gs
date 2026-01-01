package gw.apd.model.generate

@Export
class APDGosuReferencesHelper {

  /**
   * Returns a reference to this coverable type from the line using the Entity*.arrays("ArrayLink").toArray() style
   *
   * Example return for deep nested coverable type: RiskObject.arrays("ChildRisks").arrays("ChildChildRisks").toArray(new ChildChildRisk[0])
   */
  static function getEfficientArrayReferenceFromLine(cbl : APDCoverable) : String {
    var reference = getEfficientReferenceFromLineRecursive(cbl)
    if (reference?.endsWith(')')) {
      //if the reference ends with a ')' it means it's a composite reference that needs to be deref'ed to an array
      return reference.concat(".toArray(new entity.${cbl.QualifiedName}[0])")
    }
    return reference
  }

  private static function getEfficientReferenceFromLineRecursive(cbl : APDCoverable) : String {
    // if this is the line, we don't reference ourself
    if (cbl typeis APDProductLine) return null
    final var parentReference = getEfficientReferenceFromLineRecursive(cbl.Parent)
    if (parentReference == null) return cbl.LinePrefix+cbl.TypeName+"s"
    return parentReference + ".arrays(\"" + cbl.LinePrefix+cbl.TypeName+"s\")"
  }

  /**
   * Returns a reference to this coverable type from the line using the Entity*.ArrayLink style
   *
   * Example return for deep nested coverable type: RiskObject*.ChildRisks*.ChildChildRisks
   */
  public static function getSimpleReferenceFromLine(cbl : APDCoverable) : String {
    // if this is the line, we don't reference ourself
    if (cbl typeis APDProductLine) return null
    final var parentReference = getSimpleReferenceFromLine(cbl.Parent)
    if (parentReference == null) return cbl.LinePrefix+cbl.TypeName+"s"
    return parentReference + "*." + cbl.LinePrefix+cbl.TypeName+"s"
  }

  public static function getSimpleReferenceFromLine(exp : APDExposure) : String {
    final var parentReference = getSimpleReferenceFromLine(exp.Coverable)
    if (parentReference == null) return exp.Coverable.LinePrefix+exp.TypeName+"s"
    return parentReference + "*." + exp.Coverable.LinePrefix+exp.TypeName+"s"
  }

  /**
   * Returns a reference to this exposure type from the line using the Entity*.arrays("ArrayLink").toArray() style
   *
   * Example return for deep nested exposure type: RiskObject.arrays("ChildRisks").arrays("ChildChildExposures").toArray(new ChildChildExposure[0])
   */
  public static function getEfficientArrayReferenceFromLine(exp : APDExposure) : String {
    var reference : String
    var expTypeName = exp.Coverable.LinePrefix+exp.TypeName
    final var parentReference = getEfficientReferenceFromLineRecursive(exp.Coverable)
    if (parentReference == null) {
      reference = expTypeName+"s"
    } else {
      reference = parentReference + ".arrays(\""+ expTypeName+"s\").toArray(new entity.${expTypeName}[0])"
    }

    return reference
  }

  public static function getReferenceToLine(cbl : APDCoverable) : String {
    // if this is the line, we don't reference ourself
    if (cbl typeis APDProductLine) return ""
    final var parentReference = getReferenceToLine(cbl.Parent)
    return "." + cbl.Parent.TypeName + parentReference
  }

  /**
   * Traverses up the APDCoverable tree and produces a string which can be used
   * by the reified product to operate on all the coverables of this APDCoverable type from a PolicyPeriod.
   *
   * @return the reference string
   */
  static function getReferenceFromPeriodToAllCoverablesOfThisType(cbl : APDCoverable) : String {
    var result = new StringBuilder()
    var curCbl = cbl
    var compositeRefUsed = false

    while (!(curCbl typeis APDProductLine)) {
      // references the array of curCbls on the codegened parent coverable
      if (curCbl.Parent typeis APDProductLine) {
        //first reference off the line uses the "." notation
        result.insert(0, ".${curCbl.QualifiedName}s")
      } else {
        //following references use ".arrays()"
        result.insert(0, ".arrays(\"${curCbl.QualifiedName}s\")")
        compositeRefUsed = true
      }
      curCbl = curCbl.Parent
    }

    // references the PolicyLine getter in PolicyPeriodLineEnhancement.gsx
    result.insert(0, "${curCbl.ProductLine.CodeIdentifier}")

    if (compositeRefUsed) {
      result.append(".toArray(new entity.${cbl.QualifiedName}[0])")
    }

    //if the original cbl is not the policy line * at the end is needed to call properties on this reference
    if (!(cbl typeis APDProductLine)) {
      result.append("*")
    }

    return result.toString()
  }

}