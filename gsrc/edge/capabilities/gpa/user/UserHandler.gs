package edge.capabilities.gpa.user

uses edge.jsonrpc.IRpcHandler
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.user.dto.UserDTO
uses edge.capabilities.user.IUserPlugin
uses edge.security.permission.IPermissionCheckPlugin
uses edge.capabilities.gpa.security.dto.SystemPermissionDTO
uses edge.capabilities.gpa.security.dto.PermissionCheckDTO
uses edge.exception.EntityNotFoundException
uses java.lang.Exception
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.capabilities.gpa.user.dto.ProducerCodeDTO
uses edge.capabilities.gpa.user.local.IProducerCodePlugin

class UserHandler implements IRpcHandler{

  private static final var LOGGER = new Logger(Reflection.getRelativeName(UserHandler))

  var _permissionPlugin : IPermissionCheckPlugin
  var _userPlugin : IUserPlugin
  var _producerCodePlugin : IProducerCodePlugin

  @InjectableNode
  construct(aPermCheckPlugin : IPermissionCheckPlugin, aUserPlugin : IUserPlugin, aProducerCodePlugin : IProducerCodePlugin){
    this._permissionPlugin = aPermCheckPlugin
    this._userPlugin = aUserPlugin
    this._producerCodePlugin = aProducerCodePlugin
  }

  /**
   * Get current user information
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IUserPlugin#toDTO(CurrentUser)</code> -  To return a UserDTO</dd>
   * </dl>
   * @returns UserDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getCurrentUser() : UserDTO{
    return _userPlugin.toDTO(User.util.CurrentUser)
  }

  /**
   * Check user has a particular permission
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IPermissionCheckPlugin#hasSystemPermission(Permission)</code> -  To return if user has permission or not</dd>
   * </dl>
   * @param   aPermission   a permission SystemPermissionDTO
   * @returns boolean
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function hasUserSystemPermission(aPermission : SystemPermissionDTO) : boolean{
    return _permissionPlugin.hasSystemPermission(aPermission.Permission)
  }

  /**
   * Check user has permission for a particular action on a particular entity
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IPermissionCheckPlugin#hasPermission(Permission)</code> -  To return if user has permission or not</dd>
   * <dd> <code>IPermissionCheckPlugin#getPermissionEntity(PermEntityType, PermEntityID)</code> -  Get the entity that will be used to check a permission against</dd>
   * </dl>
   * @param   aPermission   a permission PermissionCheckDTO
   * @returns boolean
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function hasUserPermission(aPermCheckDTO : PermissionCheckDTO) : boolean{
    // If we are not checking a permission against a specific entity instance
    if(aPermCheckDTO.PermEntityID == null || aPermCheckDTO.PermEntityID.trim().contentEquals("")){
      return _permissionPlugin.hasPermission(aPermCheckDTO.PermEntityType, aPermCheckDTO.Permission, null)
    }

    try{
      final var permObj = _permissionPlugin.getPermissionEntity(aPermCheckDTO.PermEntityType, aPermCheckDTO.PermEntityID)

      if(permObj != null){
        // If we want to check a permission against the specific entity instance
        if(aPermCheckDTO.IsCheckPermEntity){
          return _permissionPlugin.hasPermission(aPermCheckDTO.PermEntityType, aPermCheckDTO.Permission, permObj)
        }
        return _permissionPlugin.hasPermission(permObj, aPermCheckDTO.Permission, aPermCheckDTO.IsCheckPermEntity)
      }

      throw new EntityNotFoundException()
    }catch(e : EntityNotFoundException){
      LOGGER.logError("Unable to find Entity with ID: " + aPermCheckDTO.PermEntityID, e)
    }catch(ex : Exception){
      LOGGER.logError("Unable to verify permission for user.", ex)
    }

    return false
  }

  /**
   * Get available producer codes for current user
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IProducerCodePlugin#toDTOArray(codes)</code> -  To return array of ProducerCodeDTO</dd>
   * </dl>
   * @returns ProducerCodeDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getAvailableProducerCodesForCurrentUser() : ProducerCodeDTO[]{
    final var currentUser : User = User.util.CurrentUser
    final var codes = currentUser.UserProducerCodes*.ProducerCode

    return _producerCodePlugin.toDTOArray(codes)
  }

}
