package nz.co.acc.systables.verifier

uses gw.systables.verifier.RequiredFieldsVerifierHelper
uses gw.systables.verifier.VerifierBase
uses gw.xml.parser2.PLXMLNode

uses java.util.List
uses java.util.Map

class MigrationRPFControlVerifier extends VerifierBase {
  private var _requiredFieldsVerifier: RequiredFieldsVerifierHelper
  construct() {
    super()
    _requiredFieldsVerifier = new RequiredFieldsVerifierHelper(this, {"Level", "Type", "Pattern"}.toTypedArray()
    )
  }

  override function verify(importNode: PLXMLNode): Map <PLXMLNode, List <String>> {
    var results = super.verify(importNode)
    _requiredFieldsVerifier.verify(importNode, results)
    return results
  }
}