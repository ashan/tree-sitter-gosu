package gw.apd.model.generate.generators

uses entity.APDCoverable
uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.TemplateConfig
uses gw.lang.reflect.ReflectUtil

@Export
class APDCoverableWithBasisBasedGenerator extends APDCoverableBasedGenerator {

  var _coverableBasis : Set<APDCoverable> as CoverableBasis
  var _exposureBasis : Set<APDExposure> as ExposureBasis

  construct(context : GenerationContext, coverable : APDCoverable, coverableBasis : Set<APDCoverable>, exposureBasis : Set<APDExposure>, templateConfig : TemplateConfig, targetPath : String[], targetFile : String) {
    super(context, coverable, templateConfig, targetPath, targetFile)
    _coverableBasis = coverableBasis
    _exposureBasis = exposureBasis
  }

  override property get RenderedContent() : String {
    var templateArgs : Object[] = {Coverable}
    if (_coverableBasis != null) {
      templateArgs = templateArgs.concat({CoverableBasis})
    }
    if (_exposureBasis != null) {
      templateArgs = templateArgs.concat({ExposureBasis})
    }
    return ReflectUtil.invokeStaticMethod(Config.Template, "renderToString", templateArgs) as String
  }

}