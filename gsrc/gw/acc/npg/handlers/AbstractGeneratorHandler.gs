package gw.acc.npg.handlers

uses gw.acc.npg.exception.HandlerException
uses org.slf4j.LoggerFactory

uses java.io.File
uses java.nio.charset.StandardCharsets
uses java.nio.file.FileAlreadyExistsException
uses java.nio.file.Files
uses java.nio.file.LinkOption
uses java.nio.file.NoSuchFileException
uses java.nio.file.OpenOption
uses java.nio.file.Path
uses java.nio.file.Paths
uses java.nio.file.StandardOpenOption
uses java.nio.file.attribute.FileAttribute

/**
 * Abstract generator handler for generating source code for new line of business
 */
abstract class AbstractGeneratorHandler extends AbstractHandler implements IGenerator {

  protected static final var MODULES: String = "modules"
  protected static final var CONFIGURATION: String = "configuration"
  internal static final var CONFIG: String = "config"
  protected static final var GSRC: String = "gsrc"
  protected static final var RATING: String = "rating"
  protected static final var FINANCIALS: String = "financials"
  private static final var _LOGGER = LoggerFactory.getLogger(AbstractGeneratorHandler)
  protected static final var APPLICATION_PATH: String = new File("").getCanonicalPath()

  /**
   * Create new file on the path provided.
   * {@link java.nio.file.FileAlreadyExistsException} will be thrown in case file already exists in directory.
   *
   * @param contents contents to be written to new file
   * @param filePath {@link Path} for which file need to be created
   */
  override function writeContents(contents: String, filePath: Path) {
    try {
      Files.write(filePath, contents.getBytes(StandardCharsets.UTF_8), new OpenOption[]{
          StandardOpenOption.CREATE_NEW})
    } catch (ex: FileAlreadyExistsException) {
      _LOGGER.error("Problem while writing contents. Cause: File already exists {}", ex.Message, ex)
      throw new HandlerException("Problem while writing contents. Cause: File already exists ${ex.Message}", ex)
    } catch (ex: NoSuchFileException) {
      _LOGGER.error("Problem while writing contents. Cause: File directory does not exist {}", ex.Message, ex)
      throw new HandlerException("Problem while writing contents. Cause: File directory does not exist ${ex.Message}", ex)
    }
  }

  /**
   * Read all contents in the file on given {@literal path}
   *
   * @param path {@link java.nio.file.Path} for which file contents read
   * @return file contents as text
   */
  public function readContents(path: Path): String {
    try {
      var contents = Files.readAllBytes(path)
      return new String(contents, StandardCharsets.UTF_8)
    } catch (ex: NoSuchFileException) {
      _LOGGER.error("Problem while reading contents. Cause: File does not exist {}", ex.Message, ex)
      throw new HandlerException("Problem while reading contents. Cause: File does not exist ${ex.Message}", ex)
    }
  }

  /**
   * Open file on the path provided and append the content at the end.
   * {@link java.nio.file.FileAlreadyExistsException} will be thrown in case file already exists in directory.
   *
   * @param contents contents to be appended to existing file
   * @param filePath {@link Path} for which file need to be created
   */
  override public function appendContents(contents: String, filePath: Path) {
    Files.write(filePath, contents.getBytes(StandardCharsets.UTF_8), new OpenOption[]{
        StandardOpenOption.APPEND})
  }

  override public function insertContents(contents: String, beforeMatchingText: String, filePath: Path) {
    var fileContents = new StringBuilder(readContents(filePath))
    var firstMatchingIndex = fileContents.indexOf(beforeMatchingText)
    if (firstMatchingIndex >= 0) {
      fileContents.insert(firstMatchingIndex, contents)
      Files.write(filePath, fileContents.toString().getBytes(StandardCharsets.UTF_8), new OpenOption[]{})
    } else {
      _LOGGER.warn("No match found for [{}] on file[{}]. So, File not updated.", beforeMatchingText, filePath)
    }
  }

  /**
   * Create new directory on the provided {@literal directoryPath} if it is not already exists.
   *
   * @param directoryPath {@link java.nio.file.Path} on which new directroy will be created
   */
  override function createDirectoriesIfNotExists(directoryPath: Path) {
    if (!Files.exists(directoryPath, new LinkOption[0])) {
      _LOGGER.warn("Directory [{}] does't exists. So, creating this directory.", directoryPath)
    }
    Files.createDirectories(directoryPath, new FileAttribute[0]);
  }

  function createPath(appAbsolutePath: String, configDirectories: String[], packageTokens: String[], subPackageTokens:
      String[]): Path {
    var pathFragments = configDirectories.concat(packageTokens).concat(subPackageTokens)
    var directoryPath = Paths.get(appAbsolutePath, pathFragments)
    return directoryPath
  }

}