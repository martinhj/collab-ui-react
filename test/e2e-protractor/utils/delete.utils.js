'use strict';

var config = require('./test.config.js');
var utils = require('./test.utils.js');

exports.deleteUser = function (email) {
  return utils.getToken().then(function (token) {
    var options = {
      method: 'delete',
      url: config.getAdminServiceUrl() + 'user?email=' + encodeURIComponent(email),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
    };

    return utils.sendRequest(options).then(function () {
      return 200;
    });
  });
};

exports.deleteSquaredUCUser = function (customerUuid, userUuid, token) {
  var options = {
    method: 'delete',
    url: config.getCmiServiceUrl() + 'common/customers/' + customerUuid + '/users/' + userUuid,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  };

  return utils.sendRequest(options).then(function () {
    return 204;
  });
};

exports.deleteSquaredUCCustomer = function (customerUuid, token) {
  var options = {
    method: 'delete',
    url: config.getCmiServiceUrl() + 'common/customers/' + customerUuid,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  };
  return utils.sendRequest(options).then(function () {
    return 204;
  });
};
