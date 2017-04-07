(function () {
  'use strict';

  /* @ngInject  */
  function CsdmDataModelService($q, $timeout, $rootScope, CsdmCacheUpdater, CsdmDeviceService, CsdmCodeService, CsdmPlaceService, CsdmHuronOrgDeviceService, CsdmPoller, CsdmConverter, CsdmHubFactory, Authinfo) {

    var placesUrl = CsdmPlaceService.getPlacesUrl();

    var csdmHuronOrgDeviceService = CsdmHuronOrgDeviceService.create(Authinfo.getOrgId());

    var theDeviceMap = {};
    var placesDataModel = {};
    var cloudBerryDevicesLoaded = false;
    var huronDevicesLoaded = false;
    var placesLoaded = false;
    var pollingGracePeriodActive = true;

    var devicesFetchedDeferred;
    var devicesFastFetchedDeferred;
    var placesMapReadyDeferred;
    var accountsFetchedDeferred;
    var slowResolved;

    var isBigOrgPromise;

    function isBigOrg() {

      if (!isBigOrgPromise) {
        isBigOrgPromise = CsdmPlaceService.getSearchPlacesList("xy")//This method/hack was adapted from the users pages
          .then(function () {
            return $q.resolve(false);
          })
          .catch(function (err) {
            return $q.resolve(err !== null && err.status === 502);
          });
      }

      return isBigOrgPromise;
    }

    function fetchDevices() {
      devicesFetchedDeferred = devicesFetchedDeferred || $q.defer();
      if (slowResolved === false) {
        return devicesFetchedDeferred.promise;
      }
      slowResolved = false;
      if (!devicesFastFetchedDeferred) {

        //First time: kick off get huron devices: //If we disable device polling,
        // we could move csdmHuronOrgDeviceService.fetch out of (!devicesFastFetchedDeferred)
        // so it is refreshed on "single poll"
        fetchHuronDevices();

        devicesFastFetchedDeferred = CsdmDeviceService.fetchDevices() //fast
          .then(function (deviceMap) {
            if (!slowResolved) {
              updateDeviceMap(deviceMap, function (existing) {
                return !existing.isCloudberryDevice;
              });
            }
          })
          .finally(setCloudBerryDevicesLoaded);
      }

      CsdmDeviceService.fetchDevices(true) //slow
        .then(function (deviceMapSlow) {
          slowResolved = true;
          updateDeviceMap(deviceMapSlow, function (existing) {
            return !existing.isCloudberryDevice;
          });
        })
        .finally(setCloudBerryDevicesLoaded);

      return devicesFetchedDeferred.promise;
    }

    function fetchHuronDevices() {
      if (hasHuronLicenses()) {
        csdmHuronOrgDeviceService.fetchDevices()
          .then(function (huronDeviceMap) {
            updateDeviceMap(huronDeviceMap, function (existing) {
              return !existing.isHuronDevice;
            });
          })
          .finally(setHuronDevicesLoaded);
      } else {
        setHuronDevicesLoaded();
      }
    }

    function hasHuronLicenses() {
      return _.filter(
          Authinfo.getLicenses(),
          function (l) {
            return l.licenseType === 'COMMUNICATION';
          }).length > 0;
    }

    function updateDeviceMap(deviceMap, keepFunction) {

      CsdmCacheUpdater.update(theDeviceMap, deviceMap, function (deletedDevice) {
        var shouldKeep = keepFunction && keepFunction(deletedDevice);
        if (!shouldKeep) {
          var placeUrl = getPlaceUrl(deletedDevice);
          if (placesDataModel[placeUrl]) {
            _.unset(placesDataModel, [placeUrl, 'devices', deletedDevice.url]); // delete device from the place
          }
        }
        return shouldKeep;
      });

      _.each(_.values(deviceMap), function (d) {
        if (d.accountType != 'PERSON') {
          addOrUpdatePlaceInDataModel(d);
        }
      });

      updatePlacesCache();
    }

    function subscribeToChanges(scope, callback) {
      var unRegister = $rootScope.$on('PLACES_OR_DEVICES_UPDATED', callback);
      scope.$on('$destroy', unRegister);
      return unRegister;
    }

    function notifyDevicesInPlace(cisUuid, event) {
      var place = placesDataModel[placesUrl + cisUuid];
      if (place) {
        _.each(place.devices, function (d) {
          CsdmDeviceService.notifyDevice(d.url, event);
        });
      }
    }

    function notifyListeners() {
      $rootScope.$emit('PLACES_OR_DEVICES_UPDATED');
    }

    function setCloudBerryDevicesLoaded() {
      if (!cloudBerryDevicesLoaded) {
        cloudBerryDevicesLoaded = true;

        if (huronDevicesLoaded) {
          devicesFetchedDeferred.resolve(theDeviceMap);
        }
      }
    }

    function setHuronDevicesLoaded() {
      if (!huronDevicesLoaded) {
        huronDevicesLoaded = true;

        if (cloudBerryDevicesLoaded) {
          devicesFetchedDeferred.resolve(theDeviceMap);
        }
      }
    }

    function setPlacesLoaded() {
      placesLoaded = true;
      accountsFetchedDeferred.resolve(placesDataModel);
      updatePlacesCache();
    }

    function fetchAccounts() {
      accountsFetchedDeferred = $q.defer();

      isBigOrg().then(function (isBig) {
        if (isBig) {
          setPlacesLoaded();
          return;
        }
        CsdmPlaceService.getPlacesList()
          .then(function (accounts) {
            _.each(_.values(accounts), function (a) {
              addOrUpdatePlaceInDataModel(a);
            });
          })
          .finally(function () {
            setPlacesLoaded();
          });
      });

      return accountsFetchedDeferred.promise;
    }

    function getDevicesMap(refreshHuron) {
      if (!devicesFetchedDeferred) {
        fetchDevices();
      } else if (refreshHuron) {
        fetchHuronDevices();
      }

      return devicesFetchedDeferred.promise;
    }

    function getAccountsMap() {

      if (!accountsFetchedDeferred) {
        fetchAccounts();
      }
      return accountsFetchedDeferred.promise;
    }

    function getPlaceByCisUuid(cisUuid) {
      return CsdmPlaceService
        .fetchItem(CsdmPlaceService.getPlacesUrl() + cisUuid)
        .then(function (reloadedPlace) {

          var updatedPlace = CsdmCacheUpdater.updateOne(placesDataModel, reloadedPlace.url, reloadedPlace, null, true);
          _.each(reloadedPlace.devices, function (reloadedDevice) {
            CsdmCacheUpdater.updateOne(theDeviceMap, reloadedDevice.url, reloadedDevice);
          });

          return updatedPlace;
        });
    }

    function deleteItem(item) {
      var service = getServiceForDevice(item);
      if (!service) {
        return $q.reject();
      }

      return service.deleteItem(item)
        .then(function () {
          if (item.isPlace) {
            _.unset(placesDataModel, [item.url]);
            _.each(item.devices, function (dev) {
              _.unset(theDeviceMap, [dev.url]);
            });
          } else {
            _.unset(theDeviceMap, [item.url]);
            var placeUrl = getPlaceUrl(item);
            if (placesDataModel[placeUrl]) {
              _.unset(placesDataModel, [placeUrl, 'devices', item.url]); // delete device from the place
            }
          }
          notifyListeners();
        });
    }

    function getPlaceUrl(device) {
      return placesUrl + device.cisUuid;
    }

    function createCsdmPlace(name, entitlements, directoryNumber, externalNumber, externalLinkedAccounts) {
      return CsdmPlaceService.createCsdmPlace(name, entitlements, directoryNumber, externalNumber, externalLinkedAccounts)
        .then(onCreatedPlace);
    }

    function createCmiPlace(name, entitlements, directoryNumber, externalNumber) {
      return CsdmPlaceService.createCmiPlace(name, entitlements, directoryNumber, externalNumber)
        .then(onCreatedPlace);
    }

    function updateCloudberryPlace(objectToUpdate, entitlements, directoryNumber, externalNumber, externalLinkedAccounts) {
      var placeUrl = getPlaceUrl(objectToUpdate);
      return CsdmPlaceService.updatePlace(placeUrl, entitlements, directoryNumber, externalNumber, externalLinkedAccounts)
        .then(function (place) {
          addOrUpdatePlaceInDataModel(place);
          notifyListeners();
          return place;
        });
    }

    function createCodeForExisting(cisUuid) {
      return CsdmCodeService.createCodeForExisting(cisUuid);
    }

    function updateItemName(objectToUpdate, newName) {
      if (!objectToUpdate.isPlace) {
        return $q.reject();
      }
      var service = getServiceForDevice(objectToUpdate);
      if (!service) {
        return $q.reject();
      }

      return service.updateItemName(objectToUpdate, newName)
        .then(function (updatedObject) {

          //Keep the devices reference in the places dm:
          var newDeviceList = updatedObject.devices;
          var cachedPlace = placesDataModel[objectToUpdate.url];

          if (cachedPlace) {
            updatedObject.devices = cachedPlace.devices;
          }

          _.each(newDeviceList, function (updatedDevice) {
            CsdmCacheUpdater.updateOne(theDeviceMap, updatedDevice.url, updatedDevice);

            var deviceInPlace = _.find(updatedObject.devices, { url: updatedDevice.url });
            if (deviceInPlace) {
              CsdmCacheUpdater.updateSingle(deviceInPlace, updatedDevice.url, updatedDevice);
            }
          });

          var updatedPlace = CsdmCacheUpdater.updateOne(placesDataModel, updatedObject.url, updatedObject, null, true);
          notifyListeners();
          return updatedPlace;
        });
    }

    function getServiceForDevice(unknownDevice) {
      if (unknownDevice.isCloudberryDevice) {
        return CsdmDeviceService;
      } else if (unknownDevice.isPlace) {
        return CsdmPlaceService;
      } else if (unknownDevice.isHuronDevice) {
        return csdmHuronOrgDeviceService;
      }
    }

    function updateTags(objectToUpdate, newTags) {

      var service = getServiceForDevice(objectToUpdate);
      if (!service) {
        return $q.reject();
      }
      return service.updateTags(objectToUpdate.url, newTags)
        .then(function () {

          var existingDevice = theDeviceMap[objectToUpdate.url];
          if (existingDevice) {
            existingDevice.tags = newTags;
          }

          return existingDevice || objectToUpdate;
        });
    }

    function reloadItem(item) {
      var service = getServiceForDevice(item);
      if (!service) {
        return $q.reject();
      }

      if (item.isPlace) {
        return service.fetchItem(item.url).then(function (reloadedPlace) {
          var deviceDeleted = false;
          _.each(_.difference(_.values(item.devices), _.values(reloadedPlace.devices)), function (deletedDevice) {
            _.unset(theDeviceMap, [deletedDevice.url]);

            deviceDeleted = true;
          });

          var updateRes = addOrUpdatePlaceInDataModel(reloadedPlace);

          if (deviceDeleted || updateRes.deviceAdded || updateRes.placeRenamed) {
            notifyListeners();
          }
          return updateRes.item;
        });
      } else if (item.type === 'huron') {
        return $q.reject();
      } else {
        return service.fetchItem(item.url).then(function (reloadedDevice) {
          var deviceIsNew = !theDeviceMap[item.url];
          var updatedDevice = CsdmCacheUpdater.updateOne(theDeviceMap, item.url, reloadedDevice);
          if (deviceIsNew) {
            notifyListeners();
          }
          return updatedDevice;
        });
      }
    }

    function hasDevices() {
      return theDeviceMap && Object.keys(theDeviceMap).length > 0;
    }

    function hasLoadedAllDeviceSources() {
      return cloudBerryDevicesLoaded && huronDevicesLoaded;
    }

    function onCreatedPlace(place) {
      var updatedPlace = addOrUpdatePlaceInDataModel(place).item;
      notifyListeners();
      return updatedPlace;
    }

    function addOrUpdatePlaceInDataModel(item) {

      var newPlaceUrl = getPlaceUrl(item);
      var reloadedPlace = placesDataModel[newPlaceUrl];

      if (!reloadedPlace && item.isPlace && item.url) {
        reloadedPlace = placesDataModel[item.url];
      }

      if (!reloadedPlace) {
        reloadedPlace = CsdmConverter.convertPlace({ url: newPlaceUrl, isPlace: true, devices: {} });
      }

      var wasRenamed = item.displayName && item.displayName !== reloadedPlace.displayName;
      CsdmConverter.updatePlaceFromItem(reloadedPlace, item);
      var updatedPlace = CsdmCacheUpdater.updateOne(placesDataModel, reloadedPlace.url, reloadedPlace, null, true);
      var hasNewDevice = false;

      _.each(reloadedPlace.devices, function (reloadedDevice) {
        hasNewDevice = hasNewDevice || !theDeviceMap[reloadedDevice.url];
        CsdmCacheUpdater.updateOne(theDeviceMap, reloadedDevice.url, reloadedDevice);
      });

      return {
        item: updatedPlace,
        deviceAdded: hasNewDevice,
        placeRenamed: wasRenamed,
      };
    }

    function updatePlacesCache() {
      if (huronDevicesLoaded && cloudBerryDevicesLoaded && placesLoaded) {
        _.mapValues(placesDataModel, function (p) {
          p.devices = _.pickBy(theDeviceMap, function (d) {
            return d.cisUuid == p.cisUuid;
          });
          return p;
        });
        notifyListeners();
      }
    }

    function startPollingGracePeriod() {

      $timeout(function () {
        pollingGracePeriodActive = false;
      }, 30000);
    }

    function retrieveDevicesAndAccountsAndGeneratePlaceMap() {

      var placesMapReadyPromise = $q.defer();
      var getDevicesPromise = getDevicesMap();

      getAccountsMap().then(function () {
        getDevicesPromise.then(function () {
          startPollingGracePeriod();
          updatePlacesCache();
          placesMapReadyPromise.resolve(placesDataModel);
        });
      });

      return placesMapReadyPromise;
    }

    function reFetchDevicesAndAccountsAndGeneratePlaceMap() {

      var placesMapReadyPromise = $q.defer();
      var getDevicesPromise = fetchDevices();

      fetchAccounts().then(function () {
        getDevicesPromise.then(function () {
          startPollingGracePeriod();
          updatePlacesCache();
          placesMapReadyPromise.resolve(placesDataModel);
        });
      });

      return placesMapReadyPromise;
    }

    function getPlacesMap(refreshIfOld) {

      if (!placesMapReadyDeferred) {
        placesMapReadyDeferred = retrieveDevicesAndAccountsAndGeneratePlaceMap();
      } else if (refreshIfOld && !pollingGracePeriodActive) {
        reFetchDevicesAndAccountsAndGeneratePlaceMap();
      }
      return placesMapReadyDeferred.promise;
    }

    function getSearchPlacesMap(searchString) {
      return CsdmPlaceService.getSearchPlacesList(searchString);
    }

    function devicePollerOn(event, listener, opts) {
      var hub = CsdmHubFactory.create();
      CsdmPoller.create(fetchDevices, hub);
      hub.on(event, listener, opts);
    }

    return {
      devicePollerOn: devicePollerOn,
      getPlaceByCisUuid: getPlaceByCisUuid,
      getPlacesMap: getPlacesMap,
      getSearchPlacesMap: getSearchPlacesMap,
      getDevicesMap: getDevicesMap,
      deleteItem: deleteItem,
      updateItemName: updateItemName,
      updateTags: updateTags,
      reloadItem: reloadItem,
      hasDevices: hasDevices,
      hasLoadedAllDeviceSources: hasLoadedAllDeviceSources,
      createCodeForExisting: createCodeForExisting,
      createCsdmPlace: createCsdmPlace,
      createCmiPlace: createCmiPlace,
      updateCloudberryPlace: updateCloudberryPlace,
      subscribeToChanges: subscribeToChanges,
      notifyDevicesInPlace: notifyDevicesInPlace,
      isBigOrg: isBigOrg,
    };
  }

  angular
    .module('Squared')
    .service('CsdmDataModelService', CsdmDataModelService);
}());
