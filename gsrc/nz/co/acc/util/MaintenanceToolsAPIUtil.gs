package nz.co.acc.util

uses gw.webservice.pc.pc900.MaintenanceToolsAPI

class MaintenanceToolsAPIUtil {

  static function getMaintenanceToolsAPI() : MaintenanceToolsAPI {
    return new MaintenanceToolsAPI()
  }
}