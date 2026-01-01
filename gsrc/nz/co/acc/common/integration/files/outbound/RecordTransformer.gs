package nz.co.acc.common.integration.files.outbound

/**
 * Created by zhangji on 8/02/2017.
 */
interface RecordTransformer {

  function transformXMLToFileFormat(
      xmlStr : String,
      accountNumber : String,
      addressType : AddressPolicyType_ACC) : String

}