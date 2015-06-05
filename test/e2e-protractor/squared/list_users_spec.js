'use strict';
/*jshint loopfunc: true */

/* global describe */
/* global it */
/* global browser */

describe('List users flow', function () {

  beforeEach(function () {
    browser.ignoreSynchronization = true;
  });
  afterEach(function () {
    browser.ignoreSynchronization = false;
  });

  it('should login as non-sso admin user', function () {
    login.login('pbr-admin');
  });

  it('clicking on users tab should change the view', function () {
    navigation.clickUsers();
  });

  it('should search and click on user', function () {
    utils.search(users.inviteTestUser.username);
    users.clickOnUser();
  });

  it('should display user admin settings panel when clicking on next arrow', function () {
    utils.click(users.rolesChevron);

    utils.expectIsDisplayed(roles.rolesDetailsPanel);

    utils.click(users.closeSidePanel);
  });

  describe('logout', function () {
    it('should log out', function () {
      navigation.logout();
    });
  });
});
