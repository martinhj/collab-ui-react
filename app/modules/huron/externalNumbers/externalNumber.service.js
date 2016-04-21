(function () {
  'use strict';

  angular.module('Huron')
    .factory('ExternalNumberService', ExternalNumberService);

  /* @ngInject */
  function ExternalNumberService($q, $translate, ExternalNumberPool, NumberSearchServiceV2, PstnSetupService, TelephoneNumberService, Notification) {
    var service = {
      refreshNumbers: refreshNumbers,
      clearNumbers: clearNumbers,
      setAllNumbers: setAllNumbers,
      getAllNumbers: getAllNumbers,
      getAssignedNumbers: getAssignedNumbers,
      getPendingNumbers: getPendingNumbers,
      getPendingOrders: getPendingOrders,
      getUnassignedNumbers: getUnassignedNumbers,
      getUnassignedNumbersWithoutPending: getUnassignedNumbersWithoutPending,
      deleteNumber: deleteNumber,
      isTerminusCustomer: isTerminusCustomer,
      getPendingOrderQuantity: getPendingOrderQuantity
    };
    var allNumbers = [];
    var pendingNumbers = [];
    var unassignedNumbers = [];
    var terminusDetails = [];
    var pendingOrders = [];
    var assignedNumbers = [];

    return service;

    function refreshNumbers(customerId) {
      clearNumbers();
      return isTerminusCustomer(customerId)
        .then(function (isSupported) {
          if (isSupported) {
            return PstnSetupService.listPendingNumbers(customerId)
              .then(formatNumberLabels)
              .then(function (numbers) {
                _.forEach(numbers, function (number) {
                  if (_.has(number, 'orderNumber') || _.has(number, 'quantity')) {
                    pendingOrders.push(number);
                  } else {
                    pendingNumbers.push(number);
                  }
                });
              })
              .catch(function (response) {
                pendingNumbers = [];
                if (!response || response.status !== 404) {
                  return $q.reject(response);
                }
              });
          }
        })
        .then(function () {
          return ExternalNumberPool.getAll(customerId)
            .then(formatNumberLabels)
            .then(function (numbers) {
              unassignedNumbers = filterUnassigned(numbers);
              assignedNumbers = filterAssigned(numbers);
              allNumbers = pendingNumbers.concat(getNumbersWithoutPending(numbers));
            });
        })
        .catch(function (response) {
          clearNumbers();
          return $q.reject(response);
        });
    }

    function deleteNumber(customerId, number) {
      return isTerminusCustomer(customerId)
        .then(function (isSupported) {
          if (isSupported) {
            return PstnSetupService.deleteNumber(customerId, number.pattern);
          } else {
            return ExternalNumberPool.deletePool(customerId, number.uuid);
          }
        });
    }

    function clearNumbers() {
      allNumbers = [];
      pendingNumbers = [];
      unassignedNumbers = [];
      pendingOrders = [];
      assignedNumbers = [];
    }

    function formatNumberLabels(numbers) {
      _.forEach(numbers, function (number) {
        if (_.has(number, 'quantity')) {
          number.label = number.pattern + ' ' + $translate.instant('pstnSetup.quantity') + ': ' + number.quantity;
        } else if (_.has(number, 'orderNumber')) {
          number.label = $translate.instant('pstnSetup.orderNumber') + ' ' + number.orderNumber;
        } else {
          number.label = TelephoneNumberService.getDIDLabel(number.pattern);
        }
      });
      return numbers;
    }

    function filterUnassigned(numbers) {
      // return numbers that do not contain a directoryNumber
      return _.reject(numbers, 'directoryNumber');
    }

    function filterPending(numbers) {
      // return numbers that do not contain a uuid
      return _.reject(numbers, 'uuid');
    }

    function filterAssigned(numbers) {
      return _.filter(numbers, 'directoryNumber');
    }

    function setAllNumbers(_allNumbers) {
      allNumbers = _allNumbers || [];
      unassignedNumbers = filterUnassigned(allNumbers);
      pendingNumbers = filterPending(allNumbers);
      assignedNumbers = filterAssigned(allNumbers);
    }

    function getAllNumbers() {
      return allNumbers;
    }

    function getAssignedNumbers() {
      return assignedNumbers;
    }

    function getPendingNumbers() {
      return pendingNumbers;
    }

    function getPendingOrders() {
      return pendingOrders;
    }

    function getUnassignedNumbers() {
      return unassignedNumbers;
    }

    function getUnassignedNumbersWithoutPending() {
      return getNumbersWithoutPending(unassignedNumbers);
    }

    // unable to use _.differenceBy yet
    function getNumbersWithoutPending(numbersArray) {
      return _.reject(numbersArray, function (numberObj) {
        return _.some(pendingNumbers, {
          pattern: numberObj.pattern
        });
      });
    }

    function isTerminusCustomer(customerId) {
      if (_.find(terminusDetails, 'customerId', customerId)) {
        return $q.resolve(true);
      }
      return PstnSetupService.getCustomer(customerId)
        .then(_.partial(allowPstnSetup, customerId))
        .catch(_.partial(hasExternalNumbers, customerId));
    }

    function hasExternalNumbers(customerId) {
      return NumberSearchServiceV2.get({
        customerId: customerId,
        type: 'external'
      }).$promise.then(function (response) {
        if (_.get(response, 'numbers.length') !== 0) {
          return false;
        } else {
          return allowPstnSetup(customerId);
        }
      });
    }

    function allowPstnSetup(customerId) {
      terminusDetails.push({
        customerId: customerId
      });
      return true;
    }

    function getPendingOrderQuantity() {
      var pendingOrderNumberQuantity = 0;
      _.forEach(getPendingOrders(), function (order) {
        if (_.has(order, 'quantity')) {
          pendingOrderNumberQuantity += order.quantity;
        }
      });
      return pendingOrderNumberQuantity;
    }
  }
})();
