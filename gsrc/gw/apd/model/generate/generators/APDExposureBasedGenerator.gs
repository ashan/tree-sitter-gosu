package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.TemplateConfig
uses gw.lang.reflect.ReflectUtil

@Export
class APDExposureBasedGenerator extends AbstractTemplateBasedGenerator {

  var _exposure : APDExposure

  construct(context : GenerationContext, exposure : APDExposure, templateConfig : TemplateConfig, targetPath : String[], targetFile : String) {
    super(context, templateConfig, targetPath.concat({targetFile}))
    _exposure = exposure
  }

  override property get RenderedContent() : String {
    return ReflectUtil.invokeStaticMethod(Config.Template, "renderToString", {_exposure}) as String
  }

}