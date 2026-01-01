package nz.co.acc.account.error

/**
 * Created by Chris Anderson on 27/01/2020.
 */
class AccountNotFoundException extends RuntimeException {
    construct(message: String) {
    super(message)
    }
}