package gw.apd.model.generate.generators

uses gw.apd.model.generate.templates.GosuFileDisclaimer
uses gw.apd.model.generate.templates.TemplateConfig

uses java.nio.file.Files
uses java.nio.file.Path

@Export
class TemplateBasedContentGenerator implements ContentGenerator {

  var _templateConfig : TemplateConfig
  var _path : Path

  construct(templateConfig : TemplateConfig, path : Path) {
    _templateConfig = templateConfig
    _path = path
  }

  override property get ShouldGenerateContent() : boolean {
    return !_templateConfig.IsExtension || (_templateConfig.IsExtension && !fileExists(_path))
  }

  override function finalizeContent(content : String) : String {
    if (_templateConfig.WithDisclaimer) {
      switch (_templateConfig.ContentType) {
        case GOSU:
          var disclaimer = GosuFileDisclaimer.renderToString()
          return disclaimer + content
      }
    }

    return content
  }

  private function fileExists(path : Path) : boolean {
    return Files.exists(path, {})
  }

}