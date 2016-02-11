'use strict';

describe('Auth Service', function () {
  beforeEach(module('Core'));

  var Auth, Authinfo, $httpBackend, Config, Storage, $window, SessionStorage;

  beforeEach(module(function ($provide) {
    $provide.value('$window', $window = {});
  }));

  beforeEach(inject(function (_Auth_, _Authinfo_, _$httpBackend_, _Config_, _Storage_, _SessionStorage_) {
    Auth = _Auth_;
    Config = _Config_;
    Storage = _Storage_;
    Authinfo = _Authinfo_;
    $httpBackend = _$httpBackend_;
    SessionStorage = _SessionStorage_;
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should get account info using correct API', function (done) {
    Config.getAdminServiceUrl = sinon.stub().returns('foo/');

    $httpBackend
      .expectGET('foo/organization/bar/accounts')
      .respond(200, {
        foo: 'bar'
      });

    Auth.getAccount('bar').then(function (res) {
      expect(res.data.foo).toBe('bar');
      _.defer(done);
    });

    $httpBackend.flush();
  });

  it('should get new access token', function (done) {
    Config.oauthClientRegistration = {
      scope: 'scope'
    };
    Config.getOauth2Url = sinon.stub().returns('oauth/');
    Config.getRedirectUrl = sinon.stub().returns('redir');
    Config.getOauthCodeUrl = sinon.stub().returns('codeUrl-');
    Config.getOAuthClientRegistrationCredentials = stubCredentials();

    $httpBackend
      .expectPOST('oauth/access_token', 'codeUrl-scope&redir', assertCredentials)
      .respond(200, {
        access_token: 'accessTokenFromAPI'
      });

    Auth.getNewAccessToken('argToGetNewAccessToken').then(function (accessToken) {
      expect(accessToken).toBe('accessTokenFromAPI');
      expect(Config.getOauthCodeUrl.getCall(0).args[0]).toBe('argToGetNewAccessToken');
      _.defer(done);
    });

    $httpBackend.flush();
  });

  it('should refresh access token', function (done) {
    Storage.get = sinon.stub().returns('fromStorage');
    Config.getOauth2Url = sinon.stub().returns('oauth2Url/');
    Config.getOauthAccessCodeUrl = sinon.stub().returns('accessCodeUrl');
    Config.getOAuthClientRegistrationCredentials = stubCredentials();

    $httpBackend
      .expectPOST('oauth2Url/access_token', 'accessCodeUrl', assertCredentials)
      .respond(200, {
        access_token: 'accessTokenFromAPI'
      });

    Auth.refreshAccessToken('argToGetNewAccessToken').then(function (accessToken) {
      expect(accessToken).toBe('accessTokenFromAPI');
      expect(Storage.get.getCall(0).args[0]).toBe('refreshToken');
      expect(Config.getOauthAccessCodeUrl.getCall(0).args[0]).toBe('fromStorage');
      _.defer(done);
    });

    $httpBackend.flush();
  });

  it('should set access token', function (done) {
    Config.getOauth2Url = sinon.stub().returns('oauth2Url/');
    Config.oauthClientRegistration = {
      atlas: {
        scope: 'scope'
      }
    };
    Config.oauthUrl = {
      oauth2ClientUrlPattern: 'oauth2ClientUrlPattern-'
    };
    Config.getOAuthClientRegistrationCredentials = stubCredentials();

    $httpBackend
      .expectPOST('oauth2Url/access_token', 'oauth2ClientUrlPattern-scope', assertCredentials)
      .respond(200, {
        access_token: 'accessTokenFromAPI'
      });

    Auth.setAccessToken().then(function (accessToken) {
      expect(accessToken).toBe('accessTokenFromAPI');
      _.defer(done);
    });

    $httpBackend.flush();
  });

  it('should refresh token and resend request', function (done) {
    Config.getOauth2Url = sinon.stub().returns('');

    $httpBackend
      .expectPOST('access_token')
      .respond(200, {
        access_token: ''
      });

    $httpBackend
      .expectGET('foo')
      .respond(200, {
        bar: 'baz'
      });

    Auth.refreshAccessTokenAndResendRequest({
      config: {
        method: 'GET',
        url: 'foo'
      }
    }).then(function (res) {
      expect(res.data.bar).toBe('baz');
      _.defer(done);
    });

    $httpBackend.flush();
  });

  it('should logout', function () {
    var loggedOut = sinon.stub();
    $window.location = {};
    Storage.clear = sinon.stub();
    Config.getLogoutUrl = sinon.stub().returns('logoutUrl');
    Storage.get = sinon.stub().returns('accessToken');
    Config.getOauthDeleteTokenUrl = sinon.stub().returns('OauthDeleteTokenUrl');
    Config.getOAuthClientRegistrationCredentials = stubCredentials();

    $httpBackend
      .expectPOST('OauthDeleteTokenUrl', 'token=accessToken', assertCredentials)
      .respond(200, {});

    Auth.logout().then(loggedOut);

    $httpBackend.flush();

    expect(Storage.clear.callCount).toBe(1);
    expect($window.location.href).toBe('logoutUrl');
    expect(loggedOut.callCount).toBe(1);
  });

  describe('authorize', function () {

    beforeEach(function () {
      SessionStorage.get = sinon.stub();
      Config.getAdminServiceUrl = sinon.stub().returns('path/');
    });

    it('should use correct URL if customer org', function (done) {
      SessionStorage.get.withArgs('customerOrgId').returns('1337');
      $httpBackend
        .expectGET('path/organization/1337/userauthinfo')
        .respond(500, {});

      Auth.authorize().catch(function () {
        _.defer(done);
      });

      $httpBackend.flush();
    });

    it('should use correct URL if partner org', function (done) {
      SessionStorage.get.withArgs('partnerOrgId').returns('1337');
      $httpBackend
        .expectGET('path/organization/1337/userauthinfo?launchpartnerorg=true')
        .respond(500, {});

      Auth.authorize().catch(function () {
        _.defer(done);
      });

      $httpBackend.flush();
    });

    it('should use correct URL if other org', function (done) {
      $httpBackend
        .expectGET('path/userauthinfo')
        .respond(500, {});

      Auth.authorize().catch(function () {
        _.defer(done);
      });

      $httpBackend.flush();
    });

    describe('given user is full admin', function () {

      beforeEach(function () {
        Config.getMessengerServiceUrl = sinon.stub().returns('msn');
        $httpBackend
          .expectGET('path/userauthinfo')
          .respond(200, {
            orgId: 1337,
            roles: ['Full_Admin']
          });
      });

      it('services should be fetched', function () {
        $httpBackend
          .expectGET('path/organizations/1337/services')
          .respond(500, {});

        Auth.authorize();

        $httpBackend.flush();
      });

      it('returned entitlements should be used and webex api should be called', function () {
        $httpBackend
          .expectGET('path/organizations/1337/services')
          .respond(200, {
            entitlements: ['foo']
          });

        $httpBackend
          .expectGET('msn/orgs/1337/cisync/')
          .respond(200, {});

        Authinfo.initialize = sinon.stub();

        Auth.authorize();

        $httpBackend.flush();

        expect(Authinfo.initialize.callCount).toBe(1);

        var result = Authinfo.initialize.getCall(0).args[0];
        expect(result.services[0]).toBe('foo');
      });

    });

    describe('given user is not admin', function () {

      beforeEach(function () {
        Config.getMessengerServiceUrl = sinon.stub().returns('msn');
        $httpBackend
          .expectGET('path/userauthinfo')
          .respond(200, {
            orgId: 1337,
            services: [{
              ciService: 'foo',
              sqService: 'bar'
            }]
          });
        $httpBackend
          .expectGET('msn/orgs/1337/cisync/')
          .respond(200, {});
        Authinfo.initialize = sinon.stub();
        Authinfo.initializeTabs = sinon.stub();
      });

      it('massaged services are used and webex api should be called', function (done) {
        Auth.authorize().then(function () {
          _.defer(done);
        });

        $httpBackend.flush();

        expect(Authinfo.initialize.callCount).toBe(1);

        var result = Authinfo.initialize.getCall(0).args[0];
        expect(result.services[0].ciName).toBe('foo');
        expect(result.services[0].serviceId).toBe('bar');
        expect(result.services[0].ciService).toBe(undefined);
        expect(result.services[0].sqService).toBe(undefined);
      });

      it('will initialize tabs if not admin', function (done) {
        Auth.authorize().then(function () {
          _.defer(done);
        });

        $httpBackend.flush();

        expect(Authinfo.initializeTabs.callCount).toBe(1);
      });

      it('will fetch account info if admin', function (done) {
        Authinfo.isAdmin = sinon.stub().returns(true);
        Authinfo.getOrgId = sinon.stub().returns(42);
        Authinfo.updateAccountInfo = sinon.stub();

        $httpBackend
          .expectGET('path/organization/42/accounts')
          .respond(200, {});

        Auth.authorize().then(function () {
          _.defer(done);
        });

        $httpBackend.flush();

        expect(Authinfo.initializeTabs.callCount).toBe(1);
        expect(Authinfo.updateAccountInfo.callCount).toBe(1);
      });

    });

    it('will add some webex stuff given some condition', function (done) {
      Authinfo.initialize = sinon.stub();
      Config.getMessengerServiceUrl = sinon.stub().returns('msn');

      $httpBackend
        .expectGET('path/userauthinfo')
        .respond(200, {
          orgId: 1337,
          services: []
        });

      $httpBackend
        .expectGET('msn/orgs/1337/cisync/')
        .respond(200, {
          orgID: 'foo',
          orgName: 'bar'
        });

      Auth.authorize().then(function () {
        _.defer(done);
      });
      $httpBackend.flush();

      expect(Authinfo.initialize.callCount).toBe(1);

      var result = Authinfo.initialize.getCall(0).args[0];
      expect(result.services.length).toBe(1);
      expect(result.services[0].ciName).toBe('webex-messenger');
    });
  });

  // helpers

  function stubCredentials() {
    return sinon.stub().returns('clientRegistrationCredentials');
  }

  function assertCredentials(headers) {
    return headers['Authorization'] === 'Basic clientRegistrationCredentials';
  }

});