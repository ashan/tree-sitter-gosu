package gw.sampledata.monolinejobstatus

uses gw.api.builder.SubmissionBuilderBase
uses gw.api.databuilder.ba.BASubmissionBuilder
uses gw.api.databuilder.bop.BOPSubmissionBuilder
uses gw.api.databuilder.cp.CPSubmissionBuilder
uses gw.api.databuilder.cpp.CPPSubmissionBuilder
uses gw.api.databuilder.gl.GLSubmissionBuilder
uses gw.api.databuilder.im.IMSubmissionBuilder
uses gw.api.databuilder.pa.PASubmissionBuilder
uses gw.api.databuilder.wc.WCSubmissionBuilder

@Export
class SubmissionBuilderFactory {

  public static var INSTANCE : SubmissionBuilderFactory = new SubmissionBuilderFactory()

  private construct() {}

  static function get(productType : Type) : SubmissionBuilderBase {
    switch(productType) {
      default: throw new java.lang.IllegalArgumentException("Unsupported product type '${productType}'")
    }
  }

}
