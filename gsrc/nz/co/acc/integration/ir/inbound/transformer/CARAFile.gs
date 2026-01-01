package nz.co.acc.integration.ir.inbound.transformer

uses org.apache.commons.lang3.builder.ToStringBuilder
uses org.apache.commons.lang3.builder.ToStringStyle

uses java.io.File

class CARAFile implements IRFile {
  var _header : CARAFileHeader as readonly Header
  var _trailer : CARAFileTrailer as readonly Trailer
  var _records : ArrayList<IRFileRecord> as readonly Records = {}
  var _filename : String
  var _filePath: String as readonly FilePath

  public construct() {
  }

  public construct(file : File) {
    _filePath = file.toString()
    _filename = file.Name
    var approxRowCount = (int)(file.length() / 500) + 1
    var lines = new ArrayList<String>(approxRowCount)

    file.eachLine(\line -> {
      if (line.NotBlank) {
        lines.add(line)
      }
    })

    if (lines.Count < 3) {
      throw new IRLoadException("File only has ${lines.Count} rows")
    }

    _header = new CARAFileHeader(lines.first())
    _trailer = new CARAFileTrailer(lines.last())

    for (line in lines index i) {
      if (i == 0 or i == lines.Count - 1) {
        // skip header or trailer
        continue
      }
      switch (line.charAt(0)) {
        case '4':
          _records.add(new CARAFileRecordType4(line))
          break;
        case '5':
          _records.add(new CARAFileRecordType5(line))
          break;
        case '6':
          _records.add(new CARAFileRecordType6(line))
          break;
        default:
      }
    }
  }

  public function deriveLevyYear(): Integer {
    if (_header.IRInboundFeedType == IRInboundFeedType_ACC.TC_EMPLOYEREARNINGS) {
      var runDateTime = InboundIRUtil.parseIRHeaderRunDate(_header._runDate, _header._runTime)
      if (runDateTime.MonthValue < 4)  {
        return runDateTime.Year - 1
      } else {
        return runDateTime.Year
      }
    } else {
      return InboundIRUtil.parseCARAFilenameLevyYear(_filename) + 2000
    }
  }
  
  override function toString(): String {
    return new ToStringBuilder(this, ToStringStyle.SHORT_PREFIX_STYLE)
        .append("header", _header)
        .append("trailer", _trailer)
        .append("recordCount", _records?.Count)
        .toString()
  }
  
}