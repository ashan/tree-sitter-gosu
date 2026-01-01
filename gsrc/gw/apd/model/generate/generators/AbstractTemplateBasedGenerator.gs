package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.Generator
uses gw.apd.model.generate.TrackedFileGenerator
uses gw.apd.model.generate.templates.TemplateConfig

uses java.nio.file.Path

@Export
abstract class AbstractTemplateBasedGenerator extends TrackedFileGenerator {

  var _templateConfig : TemplateConfig as readonly Config
  var _targetPath : Path as readonly TargetPath

  abstract property get RenderedContent() : String

  construct(context : GenerationContext, templateConfig : TemplateConfig, path : Path) {
    super(context)
    _templateConfig = templateConfig
    _targetPath = path
  }

  construct(context : GenerationContext, templateConfig : TemplateConfig, pathSegments : String[]) {
    super(context)
    _templateConfig = templateConfig
    _targetPath = createPath(pathSegments)
  }

  function generate() {
    if (ContentGenerator.ShouldGenerateContent) {
      addOrReplaceFile(_targetPath, \-> ContentGenerator.finalizeContent(RenderedContent), not Config.IsExtension)
    }
  }

  protected property get ContentGenerator() : ContentGenerator {
    return new TemplateBasedContentGenerator(_templateConfig, _targetPath)
  }

}