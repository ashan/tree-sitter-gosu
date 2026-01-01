package gw.surepath.suite.integration.logging

uses gw.surepath.suite.integration.logging.obfuscations.CreditCardObfuscation

uses java.util.concurrent.locks.ReentrantLock

/**
 * This class allows you to register custom obfuscation routines based on parameter map key names.
 * When you register an obfuscation for a given name, before its output to structuredLogger
 * it will encrypt the data using the obfuscation.
 * A sample obfuscation is already included for credit card.
 */
public class RegisteredObfuscations {
  private var _isRegistered : boolean = false
  private final var _obfuscationLock : ReentrantLock = new ReentrantLock() // internal lock object used for obfuscation
  private static final var _instance : RegisteredObfuscations as readonly INSTANCE = new RegisteredObfuscations()
  private construct(){}

  /**
   * Implementing code should register any required obfuscations inside here
   * This should only be called once to register everything !
   */
  public function registerObfuscations(){
    if(_isRegistered)
      return
    using(_obfuscationLock){
      if(_isRegistered) // double lock checking, urgh, got to do it !
        return
      customRegistrations()
      _isRegistered = true
    }
  }

  /**
   * Place your custom registerations inside here !
   */
  private function customRegistrations(){
    //put custom registration code here
    StructuredLogger.registerObfuscation("creditCard",new CreditCardObfuscation()) // anything put in the context with the name "creditCard" will be obfuscated
  }


}