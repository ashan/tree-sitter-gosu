package nz.co.acc.plm.integration.files.outbound

uses nz.co.acc.common.integration.files.outbound.BaseOutboundFileTransformer
uses nz.co.acc.plm.integration.files.outbound.letter.CpxLetterFileTransformer

/**
 * Created by Nick on 27/03/2017.
 */
class FileTransformerFactory {


  public static function getFileTransformer(type: BatchProcessType): BaseOutboundFileTransformer {
    switch (type) {
      case BatchProcessType.TC_OUTBOUNDMAILHOUSELETTERSFILE_ACC:
        return new CpxLetterFileTransformer()

      default:
        return null
    }
  }
}