package edge.capabilities.profileinfo.user.local

class PlatformAddressHelper {
  static function buildDetailDisplayName(addr:Address) : String {
    return addr.addressString('\n',false,false)
  }
}
