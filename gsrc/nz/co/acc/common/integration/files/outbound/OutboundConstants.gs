package nz.co.acc.common.integration.files.outbound

/**
 * Created by Nick on 27/03/2017.
 */
interface OutboundConstants {
  //system based line separator
  var Newline: String = System.getProperty("line.separator")

  var OutboundActivityPattern :String = "outbound_failure"

  var OutboundTechnicaAccountACCID:String = "TechAccount001"

}