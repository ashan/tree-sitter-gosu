package gw.apd.model.generate.templates

@Export
class TemplateConfig {

  var _template : String
  var _contentType : ContentType as readonly ContentType
  var _isExtension : boolean as readonly IsExtension
  var _withDisclaimer : boolean as readonly WithDisclaimer

  construct(template : String, contentType : ContentType, isExtension : boolean, withDisclaimer : boolean) {
    _template = template
    _contentType = contentType
    _isExtension = isExtension
    _withDisclaimer = withDisclaimer
  }

  property get Template() : String {
    return "gw.apd.model.generate.templates.${_template}"
  }

  override function equals(that : Object) : boolean {
    if (that typeis TemplateConfig) {
      return this._template == that._template && this._isExtension == that._isExtension
    }
    return false
  }

  public enum ContentType {
    GOSU, ENTITY
  }

}