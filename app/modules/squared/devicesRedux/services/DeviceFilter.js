'use strict';

angular.module('Squared').service('DeviceFilter',

  /* @ngInject  */
  function () {

    var currentSearch, currentFilter, arr = [];

    var filters = [{
      count: 0,
      name: 'All',
      filterValue: 'all'
    }, {
      count: 0,
      name: 'Needs Activation',
      filterValue: 'codes'
    }, {
      count: 0,
      name: 'Has Issues',
      filterValue: 'issues'
    }, {
      count: 0,
      name: 'Offline',
      filterValue: 'offline'
    }, {
      count: 0,
      name: 'Online',
      filterValue: 'online'
    }];

    var getFilters = function () {
      return filters;
    };

    var updateFilters = function (list) {
      _(filters).find({
          filterValue: 'codes'
        }).count = _.chain(list)
        .filter(isActivationCode)
        .filter(matchesSearch)
        .value().length;

      _(filters).find({
          filterValue: 'issues'
        }).count = _.chain(list)
        .filter(hasIssues)
        .filter(matchesSearch)
        .value().length;

      _(filters).find({
          filterValue: 'online'
        }).count = _.chain(list)
        .filter(isOnline)
        .filter(matchesSearch)
        .value().length;

      _(filters).find({
          filterValue: 'offline'
        }).count = _.chain(list)
        .filter(isOffline)
        .filter(matchesSearch)
        .value().length;

      _(filters).find({
        filterValue: 'all'
      }).count = _.filter(list, matchesSearch).length;
    };

    function isActivationCode(item) {
      return item.needsActivation;
    }

    function hasIssues(item) {
      return item.hasIssues;
    }

    function isOnline(item) {
      return item.isOnline;
    }

    function isOffline(item) {
      return !item.isOnline && !item.needsActivation;
    }

    function setCurrentSearch(search) {
      currentSearch = (search || '').toLowerCase();
    }

    function setCurrentFilter(filter) {
      currentFilter = (filter || '').toLowerCase();
    }

    function getFilteredList(data) {
      arr.length = 0;
      updateFilters(data);

      _.each(data, function (item) {
        if (matchesSearch(item) && matchesFilter(item)) {
          arr.push(item);
        }
      });

      return arr;
    }

    function matchesSearch(item) {
      return (item.displayName || '').toLowerCase().indexOf(currentSearch || '') != -1;
    }

    function matchesFilter(item) {
      switch (currentFilter) {
      case 'all':
        return true;
      case 'codes':
        return isActivationCode(item);
      case 'issues':
        return hasIssues(item);
      case 'online':
        return isOnline(item);
      case 'offline':
        return isOffline(item);
      default:
        return true;
      }
    }

    return {
      getFilters: getFilters,
      getFilteredList: getFilteredList,
      setCurrentFilter: setCurrentFilter,
      setCurrentSearch: setCurrentSearch,
    };

  }
);
