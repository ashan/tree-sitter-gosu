package nz.co.acc.integration.ir.inbound.transformer

uses org.apache.commons.lang3.builder.ToStringBuilder
uses org.apache.commons.lang3.builder.ToStringStyle

uses java.io.File

class CREGFile implements IRFile {
  var _header : CREGFileHeader as readonly Header
  var _trailer : CREGFileTrailer as readonly Trailer
  var _records : ArrayList<IRFileRecord> as readonly Records
  var _filePath: String as readonly FilePath

  public construct() {
  }

  public construct(file : File) {
    _filePath = file.toString()
    var approxRowCount = (int)(file.length() / 500) + 1
    var lines = new ArrayList<String>(approxRowCount)

    file.eachLine(\line -> {
      if (line.NotBlank) {
        lines.add(line)
      }
    })

    if (lines.Count < 3) {
      throw new IRLoadException("File only has ${lines.Count} records")
    }

    parseHeader(lines)
    parseRecords(lines)
    parseTrailer(lines)
    validateTrailer()
  }

  private function parseHeader(lines : ArrayList<String>) {
    try {
      _header = new CREGFileHeader(lines.first())
    } catch (e : Exception) {
      throw new IRLoadException("Failed to parse file header", e)
    }
  }

  private function parseRecords(lines : ArrayList<String>) {
    _records = new ArrayList<CREGFileRecord>(lines.Count - 2)

    for (line in lines index i) {
      if (i == 0 or i == lines.Count - 1) {
        // skip header or trailer
        continue
      }
      try {
        var record = new CREGFileRecord(line)
        _records.add(record)
      } catch (e : Exception) {
        throw new IRLoadException("Failed to parse line ${i + 1}", e)
      }
    }
  }

  private function parseTrailer(lines : ArrayList<String>) {
    try {
      _trailer = new CREGFileTrailer(lines.last())
    } catch (e : Exception) {
      throw new IRLoadException("Failed to parse file trailer", e)
    }
  }

  private function validateTrailer() {
    if (_trailer.numberOfRecords != _records.Count) {
      throw new IRLoadException("Trailer record count ${_trailer.numberOfRecords} doesn't match actual record count ${_records.Count}")
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