package nz.co.acc.common.upgrade.function

uses gw.api.system.server.ServerUtil
uses gw.lang.reflect.Expando
uses gw.pl.util.FileUtil

uses nz.co.acc.common.function.Funxion

uses java.io.File
uses java.nio.file.Paths
uses java.util.function.Supplier
uses java.util.stream.Collectors

uses gw.lang.reflect.json.Json

uses nz.co.acc.common.upgrade.DatamodelUpgradeEvent
uses nz.co.acc.common.upgrade.DatamodelUpgradeType
uses nz.co.acc.common.upgrade.function.struct.ScriptDescriptor
uses nz.co.acc.common.upgrade.function.struct.ScriptStatement

/**
 * @author Ron Webb
 * @since 2019-06-14
 */
class DescriptorGenerator implements Supplier<List<ScriptDescriptor>> {

  protected var _event : DatamodelUpgradeEvent
  protected var _scriptDir : String
  protected var _type : DatamodelUpgradeType
  protected var _alwaysExecute : Boolean

  public construct(type : DatamodelUpgradeType, event : DatamodelUpgradeEvent, scriptDir : String, alwaysExecute: Boolean) {
    _event = event
    _scriptDir = scriptDir
    _type = type
    _alwaysExecute = alwaysExecute
  }


  public static function forUpgradeScripts(type : DatamodelUpgradeType, event : DatamodelUpgradeEvent): DescriptorGenerator  {
    return new DescriptorGenerator(type, event, Funxion.buildGenerator(new UpgradeDirectory()).generate(), false)
  }

  public static function forStartupScripts(type : DatamodelUpgradeType, event : DatamodelUpgradeEvent): DescriptorGenerator  {
    return new DescriptorGenerator(type, event, Funxion.buildGenerator(new StartupDirectory()).generate(), true)
  }

  protected function mapToDescriptor(jsonObject : Dynamic) : ScriptDescriptor {
    var descriptor : Dynamic = new Expando()

    descriptor.Directory = _scriptDir

    descriptor.Type = DatamodelUpgradeType.of(jsonObject.type as String)
    descriptor.Event = _event
    descriptor.Code = jsonObject.code as String
    descriptor.Description = jsonObject.description as String
    descriptor.Order = (jsonObject.order as Integer)?:-1
    descriptor.Background = Boolean.valueOf(jsonObject.background as String)
    descriptor.Disable = Boolean.valueOf(jsonObject.disable as String)
    descriptor.ServerID = ServerUtil.getServerId()
    descriptor.NoExecute = Boolean.valueOf(jsonObject.noExecute as String)
    descriptor.AlwaysExecute = _alwaysExecute

    var statements = new ArrayList<ScriptStatement>()
    descriptor.Statements = statements

    jsonObject.statements.each(\___statement : Dynamic -> {
      var sqlScriptsDir = Paths.get(_scriptDir, {(jsonObject.type as String).toLowerCase()}).toFile()
      if (!sqlScriptsDir.exists()) {
        sqlScriptsDir.mkdirs()
      }

      var statement : Dynamic = new Expando()
      statement.Mode = ___statement.mode as String
      statement.Statement = ___statement.statement as String
      statement.Directory = sqlScriptsDir.toString()
      statements.add(statement)
    })
    return descriptor
  }

  override function get() : List<ScriptDescriptor> {
    return FileUtil.getFilesInDirectory(new File(_scriptDir), "json", false)
        .toList()
        .stream()
        .map<ScriptDescriptor>(\___file -> {
          var jsonText = ___file.read()
          var jsonObject : Dynamic = Json.fromJson(jsonText)
          var descriptor : Dynamic = mapToDescriptor(jsonObject)
          descriptor.Filename = ___file.Name
          return descriptor
        })
        .filter(\___descriptor -> !___descriptor.Disable && ___descriptor.Event == _event && ___descriptor.Type == _type)
        .collect(Collectors.toList<ScriptDescriptor>())
        .orderBy(\___descriptor -> ___descriptor.Order)
  }
}