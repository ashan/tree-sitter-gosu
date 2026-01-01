package nz.co.acc.common.sampledata

uses com.guidewire.pl.web.internaltools.smoketest.MockHttpServletRequest

uses javax.servlet.http.HttpSession

/**
 * Mock the HTTP Servlet.
 */
class MockHttpServletRequest_ACC extends MockHttpServletRequest {
  private var _mockSession : HttpSession as Session

  public function getSession(createSession : boolean) : HttpSession {
    return _mockSession
  }

}