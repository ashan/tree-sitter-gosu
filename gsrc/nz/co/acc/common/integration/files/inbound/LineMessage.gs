package nz.co.acc.common.integration.files.inbound

/**
 * Created by fabianr on 18/11/2016.
 */
class LineMessage {
  private var _line: String
  private static var UTF8_BOM = "\uFEFF"
  /**
   * method to create line message
   *
   * @param line
   * @param fileName
   * @param filter   value to decide if the inbound file needs to filter BOM character, only true for document control files
   */
  construct(line: String, fileName: String, filter: boolean) {
    if (filter == true) {
      this._line = removeUTF8BOM(line)
    } else {
      this._line = line
    }
  }

  private function removeUTF8BOM(s: String): String {
    if (s.startsWith(UTF8_BOM)) {
      s = s.substring(1)
    }
    return s
  }

  public function create(): FileInboundMessage_ACC {
    var message = new FileInboundMessage_ACC()
    message.setMessage(this._line)
    message.setCreatedDateTime(new Date())
    return message
  }
}
