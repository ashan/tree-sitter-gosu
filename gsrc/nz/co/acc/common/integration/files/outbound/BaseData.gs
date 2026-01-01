package nz.co.acc.common.integration.files.outbound

uses gw.api.gx.GXOptions
uses gw.xml.XmlElement
uses gw.xml.XmlSerializationOptions

/**
 * All outbound message payload (GXModel) should extend this base data class.
 *
 * Created by Nick on 13/01/2017.
 */
abstract class BaseData {

  reified function toXML<T extends XmlElement>(type: Type<T>): String {
    var gxOpts = new GXOptions();
    gxOpts.Incremental = false
    gxOpts.Verbose = false
    var gxModel = new T(this, gxOpts)

    var xmlOpts = new XmlSerializationOptions()
    xmlOpts.XmlDeclaration = false
    xmlOpts.Sort = false
    xmlOpts.Validate = false
    return gxModel.asUTFString(xmlOpts)
  }
}