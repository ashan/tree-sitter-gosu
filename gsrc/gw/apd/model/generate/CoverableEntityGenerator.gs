package gw.apd.model.generate

uses entity.APDCoverable
uses gw.apd.model.generate.templates.coverable.CoverableEntity
uses gw.apd.model.generate.templates.coverable.CoverableName

@Export
class CoverableEntityGenerator extends TrackedFileGenerator {

  var _cbl : APDCoverable
  var _coverableGenerator : CoverableGenerator

  construct(context : GenerationContext, cbl : APDCoverable, coverableGenerator : CoverableGenerator) {
    super(context)
    _cbl = cbl
    _coverableGenerator = coverableGenerator
  }

  function generateConfig() {
    var file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.LinePrefix.concat(_cbl.TypeName).concat(".eti")}))
    addOrReplaceFile(file, \-> CoverableEntity.renderToString(_cbl))
    file = createPath(ENTITYNAMESDIRECTORY.concat(new String[]{_cbl.LinePrefix.concat(_cbl.TypeName).concat(".en")}))
    addOrReplaceFile(file, \-> CoverableName.renderToString(_cbl))

    // AS A COVERABLE
    _coverableGenerator.generateConfig()
  }

}