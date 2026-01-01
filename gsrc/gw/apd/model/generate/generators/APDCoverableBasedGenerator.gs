package gw.apd.model.generate.generators

uses entity.APDCoverable
uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.TemplateConfig
uses gw.lang.reflect.ReflectUtil

@Export
class APDCoverableBasedGenerator extends AbstractTemplateBasedGenerator {

  var _coverable : APDCoverable as Coverable

  construct(context : GenerationContext, coverable : APDCoverable, templateConfig : TemplateConfig, targetPath : String[], targetFile : String) {
    super(context, templateConfig, targetPath.concat({targetFile}))
    _coverable = coverable
  }

  override property get RenderedContent() : String {
    return ReflectUtil.invokeStaticMethod(Config.Template, "renderToString", {_coverable}) as String
  }

}