package nz.co.acc.common.edge.servlet

uses javax.servlet.ReadListener
uses javax.servlet.ServletInputStream
uses javax.servlet.http.HttpServletRequest
uses javax.servlet.http.HttpServletRequestWrapper
uses java.io.BufferedReader
uses java.io.ByteArrayInputStream
uses java.io.InputStreamReader

/**
 * Created by KasthuA on 29/05/2017.
 */
class HttpServletRequestWrapper_ACC extends HttpServletRequestWrapper {

  private var _httpServletRequest: HttpServletRequest
  private var _firstTime: boolean = true
  private var _reqBytes: byte[]


  construct(request: HttpServletRequest) {
    super(request)
    this._httpServletRequest = request
  }

  override property get Reader(): BufferedReader {
    if (_firstTime) {
      firstTime()
    }
    var inputStreamReader = new InputStreamReader(new ByteArrayInputStream(_reqBytes))
    return new BufferedReader(inputStreamReader)
  }


  override property get InputStream(): ServletInputStream {
    if (_firstTime)
      firstTime();

    var sis = new ServletInputStream() {
      private var i: int

      override public function read(): int {
        var b: byte
        if (_reqBytes.length > i) {
          b = _reqBytes[i]
          i += 1
        } else
          b = -1

        return b;
      }

      override property get Finished() : boolean {
        return false
      }

      override property get Ready() : boolean {
        return false
      }

      override property set ReadListener(readListener : ReadListener) {

      }
    }

    return sis
  }

  private function firstTime() {
    _firstTime = false
    var buffer = new StringBuffer()
    var reader = _httpServletRequest.getReader()
    var line: String = reader.readLine()
    while (line != null) {
      buffer.append(line)
      line = reader.readLine()
    }
    _reqBytes = buffer.toString().getBytes()
  }


  override public function toString() : String{
      return"HttpServletRequestWrapper_ACC{"+
      "_httpServletRequest="+_httpServletRequest+
      ", _firstTime="+_firstTime+
      ", _reqBytes="+Arrays.toString(_reqBytes)+
      '}';
}

}