package nz.co.acc.util

uses gw.surepath.suite.integration.logging.StructuredLogger_ACC

uses java.nio.file.Files
uses java.nio.file.Path
uses java.util.zip.ZipEntry
uses java.util.zip.ZipFile
uses java.util.zip.ZipOutputStream

class ZipUtil {
  static var LOG = StructuredLogger_ACC.INTEGRATION.withClass(ZipUtil)

  /**
   * Unzips source zip to destination folder and returns list of file names
   *
   * @param source
   * @param destination
   * @return
   */
  static function unzip(source : Path, destination : Path) {
    LOG.info("Unzip source='${source}', destination='${destination}'")

    if (Files.notExists(destination)) {
      LOG.info("Creating directory '${destination}'")
      Files.createDirectories(destination)
    }

    using(var zipFile = new ZipFile(source.toFile())) {
      var zipEntries = zipFile.entries();

      while (zipEntries.hasMoreElements()) {
        var zipEntry = zipEntries.nextElement()
        var isDirectory = zipEntry.isDirectory()
        if (isDirectory) {
          LOG.info("Creating directory '${zipEntry.getName()}'")
          Files.createDirectories(destination.resolve(zipEntry.getName()));
        } else {
          var fileName = zipEntry.getName()
          var resolvedPath = destination.resolve(fileName)
          Files.createDirectories(resolvedPath.getParent())
          LOG.info("Writing '${resolvedPath}'")
          var zis = zipFile.getInputStream(zipEntry)
          Files.copy(zis, resolvedPath)
          zis.close()
        }
      }
    }

  }

  static function zip(sourceDirPath : Path, zipFilePath : Path) {
    LOG.info("Zip source='${sourceDirPath}', destination='${zipFilePath}'")
    using (var zipOutputStream = new ZipOutputStream(Files.newOutputStream(zipFilePath))) {
      var paths = Files.walk(sourceDirPath)
      paths.filter(\path -> !Files.isDirectory(path)).forEach(\path -> {
        var zipEntry = new ZipEntry(sourceDirPath.relativize(path).toString())
        zipOutputStream.putNextEntry(zipEntry)
        Files.copy(path, zipOutputStream)
        zipOutputStream.closeEntry()
      })
    }
  }

}