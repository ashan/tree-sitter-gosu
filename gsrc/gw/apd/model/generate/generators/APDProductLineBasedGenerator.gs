package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.TemplateConfig
uses gw.lang.reflect.ReflectUtil

@Export
class APDProductLineBasedGenerator extends AbstractTemplateBasedGenerator {

  var _productLine : APDProductLine as ProductLine

  construct(context : GenerationContext, productLine : APDProductLine, templateConfig : TemplateConfig, targetPath : String[], targetFile : String) {
    super(context, templateConfig, targetPath.concat({targetFile}))
    _productLine = productLine
  }

  override property get RenderedContent() : String {
    return ReflectUtil.invokeStaticMethod(Config.Template, "renderToString", {_productLine}) as String
  }

}