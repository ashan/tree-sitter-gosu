package nz.co.acc.common.util

uses org.apache.commons.io.FileUtils

uses java.io.ByteArrayOutputStream
uses java.io.File
uses java.io.FileInputStream
uses java.io.FileOutputStream
uses java.util.zip.Deflater
uses java.util.zip.Inflater
uses java.util.zip.ZipEntry
uses java.util.zip.ZipOutputStream

public class CompressionUtil {

  public static function compress(data: byte[]): byte[] {
    var deflater = new Deflater()
    deflater.setInput(data)
    var outputStream = new ByteArrayOutputStream(data.length)
    deflater.finish()
    var buffer = new byte[1024]
    while (!deflater.finished()) {
      var count = deflater.deflate(buffer)
      outputStream.write(buffer, 0, count)
    }

    outputStream.close()
    var output = outputStream.toByteArray()
    return output
  }

  public static function decompress(data: byte[]): byte[] {
    var inflater = new Inflater()
    inflater.setInput(data)
    var outputStream = new ByteArrayOutputStream(data.length)
    var buffer = new byte[1024]
    while (!inflater.finished()) {
      var count = inflater.inflate(buffer)
      outputStream.write(buffer, 0, count)
    }
    outputStream.close()
    var output = outputStream.toByteArray()
    return output
  }

  public static function convertFileContentToBlob(file:File) : byte[] {
    var fileContent : byte[] = null
    return FileUtils.readFileToByteArray(file);
  }

  public static function compressStringToBlob(input: String): Blob {
    return new Blob(compress(input.Bytes))
  }

  public static function zipFiles(destZipFile: File, srcFiles : Collection<File>) {
    var fos = new FileOutputStream(destZipFile);
    using (var zipOut = new ZipOutputStream(fos)) {
      for (srcFile in srcFiles) {
        var file = srcFile

        using (var fis = new FileInputStream(file)) {
          var zipEntry = new ZipEntry(file.getName())
          zipOut.putNextEntry(zipEntry)
          var bytes = new byte[1024]
          var len = 0

          while (len >= 0) {
            zipOut.write(bytes, 0, len)
            len = fis.read(bytes)
          }
          fis.close()
        }
      }
    }
    fos.close()
  }

  public static function runBenchmark(data: byte[], iterations: int) {


    var compressed: byte[]

    for (i in 0..iterations) {
      compressed = compress(data)
    }


    for (i in 0..iterations) {
      decompress(compressed)
    }


  }
}