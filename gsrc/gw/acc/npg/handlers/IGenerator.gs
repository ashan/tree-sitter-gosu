package gw.acc.npg.handlers

uses gw.acc.npg.model.ProductLine

uses java.nio.file.Path

/**
 * Generator for files generation used by product generator.
 */
interface IGenerator {

  /**
   * Generate files related to provided {@link gw.acc.npg.model.ProductLine}.
   *
   * @param productLine related to which files will be generated
   */
  function generateFiles(productLine: ProductLine)

  /**
   * Create new directory on the provided {@literal directoryPath} if it is not already exists.
   *
   * @param directoryPath {@link java.nio.file.Path} on which new directroy will be created
   */
  function createDirectoriesIfNotExists(directoryPath: Path)

  /**
   * Create new file with filePath.
   * {@link java.nio.file.FileAlreadyExistsException} will be thrown in case file already exists in directory.
   *
   * @param contents contents to be written to new file
   * @param filePath {@link java.nio.file.Path} of the file which will be created with provided contents.
   */
  function writeContents(contents: String, filePath: Path)

  /**
   * Open file on the path provided and append the content at the end.
   * {@link java.nio.file.FileAlreadyExistsException} will be thrown in case file already exists in directory.
   *
   * @param contents contents to be appended to existing file
   * @param filePath {@link Path} for which file need to be created
   */
  public function appendContents(contents: String, filePath: Path)

  /**
   * Open file on the path provided and insert the contents before first occurrence of
   * <code>beforeMatchingText</code>. File remains unchanged in case no match found.
   * Note: File should exists on <code>filePath</code> before calling this method.
   *
   * @param contents           contents to be appended to existing file
   * @param beforeMatchingText text before wich contents should be inserted
   * @param filePath           {@link Path} for which file need to be created
   */
  function insertContents(contents: String, beforeMatchingText: String, filePath: Path)
}