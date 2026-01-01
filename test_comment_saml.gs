/**
 * SAML authentication service plugin,  this plugin provides the following features
 * - Has a (configurable) list of users that authenticate against the local database with u/p (See java doc for plugin registry keys / su always authenticates locally)
 * - Can consume a SAMLAuthenticationSource object to allow portal Signle Sign On
 * - Has a hook for the clients desired authentication mechanism
 *
 * @author bdubroy
 */
