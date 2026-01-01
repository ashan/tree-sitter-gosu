package nz.co.acc.edge.capabilities.gpa.account

uses edge.PlatformSupport.Bundle
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.jsonrpc.exception.JsonRpcApplicationException
uses edge.jsonrpc.exception.JsonRpcInvalidParamsException
uses gw.api.validation.EntityValidationException

/**
 * Created by rajasekar.balasubram on 22/02/2021.
 */
class AccountHandlerUtil_ACC {

  private static var LOGGER = new Logger(Reflection.getRelativeName(AccountHandlerUtil_ACC))

  /**
   * Returns Message from the service
   *
   * @param account
   * @param status
   * @return
   */

  function updateMyACCStatus(account : Account, status : String) {
    var Status = MyA4BRegistrationStatus_ACC.get(status)
    if (Status == null) {
      throw new JsonRpcInvalidParamsException() {
        :Message = "Status code ${status} is invalid"
      }
    }
    try {
      Bundle.transaction(\bundle -> {
        account = bundle.add(account)
        account.MyA4BRegistrationStatus_ACC = Status
      })
      account.refresh()
    } catch (ex : EntityValidationException) {
      LOGGER.logError(ex)
      throw new JsonRpcApplicationException() {
        :Message = ex.Message
      }
    } catch (ex : Exception) {
      LOGGER.logError(ex)
      throw new JsonRpcApplicationException() {
        :Message = ex.Message
      }
    }
  }

}