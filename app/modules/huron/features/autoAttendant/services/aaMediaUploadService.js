(function () {
  'use strict';

  angular
    .module('uc.autoattendant')
    .factory('AAMediaUploadService', AAMediaUploadService);

  /* @ngInject */
  function AAMediaUploadService($window, $http, $rootScope, Authinfo, Upload, AACommonService, AACtrlResourcesService, Config) {
    var service = {
      upload: upload,
      retrieve: retrieve,
      getRecordingUrl: getRecordingUrl,
      validateFile: validateFile,
      isClioEnabled: isClioEnabled,
      deleteRecording: deleteRecording,
      getResources: getResources,
      notifyAsSaved: notifyAsSaved,
      notifyAsActive: notifyAsActive,
      clearResourcesExcept: clearResourcesExcept,
      cleanResourceFieldIndex: cleanResourceFieldIndex,
    };

    var devUploadBaseUrl = 'http://54.183.25.170:8001/api/notify/upload';

    var clioProdBase = 'https://clio-manager-a.wbx2.com/clio-manager/api/v1/';
    var clioIntBase = 'https://clio-manager-integration.wbx2.com/clio-manager/api/v1/';
    var clioUploadRecordingUrlSuffix = 'recordings/media';
    var clioDeleteRecordingUrlSuffix = 'recordings/';
    var clioUploadBaseUrlInt = clioIntBase + clioUploadRecordingUrlSuffix;
    var clioUploadBaseUrlProd = clioProdBase + clioUploadRecordingUrlSuffix;
    var clioDeleteBaseUrlInt = clioIntBase + clioDeleteRecordingUrlSuffix;
    var clioDeleteBaseUrlProd = clioProdBase + clioDeleteRecordingUrlSuffix;
    var uploadBaseUrl = null;
    var deleteBaseUrl = null;
    var clioEnabled = false;
    var CLIO_APP_TYPE = 'AutoAttendant';
    var ENCRYPTION_POLICY = '{"encryptionPolicy":{"strategy":"NONE"}}';
    //media upload controllers will map their unique control identifiers
    //from aa common service to an array of media resources located in clio
    //after specifying whether or not that media upload is active or not
    //as well as if the array has been saved
    //strategy is to clear out from (head, tail] if array is saved
    //and clear out from [head, tail) if array has not been saved
    //if at anytime the active attribute is false
    //resources example
    /*{
        mediaUploadCtrlN: {
          active: true,
          saved: false,
          uploads: []
        }
      }
    */
    var resources = AACtrlResourcesService.getCtrlToResourceMap();

    $rootScope.$on('CE Closed', closeResources);
    $rootScope.$on('CE Saved', saveResources);

    return service;

    function upload(file) {
      return uploadByUpload(file);
    }

    function retrieve(result) {
      return retrieveByResult(result);
    }

    function closeResources() {
      _.each(AACtrlResourcesService.getCtrlKeys(), function (key) {
        cleanResourceFieldIndex('saved', 0, key);
        delete resources[key];
      });
    }

    function saveResources() {
      _.each(AACtrlResourcesService.getCtrlKeys(), function (key) {
        cleanResourceFieldIndex('active', getResources(key).length - 1, key);
      });
    }

    function cleanResourceFieldIndex(field, index, key) {
      if (key && field) {
        if (getResources(key)[field]) {
          clearResourcesExcept(key, index);
        } else {
          deleteResources(key);
          delete resources[key];
        }
      }
    }

    function notifyAsSaved(unqCtrlId, value) {
      notifyField(unqCtrlId, value, 'saved');
    }

    function notifyAsActive(unqCtrlId, value) {
      notifyField(unqCtrlId, value, 'active');
    }

    function notifyField(unqCtrlId, value, field) {
      if (unqCtrlId && value && field) {
        getResources(unqCtrlId)[field] = value;
      }
    }

    function getResources(unqCtrlId) {
      //get the resources associated with a media controller
      //if that controller doesn't have an entry
      //create as default, then return the media controller values
      if (unqCtrlId) {
        resources[unqCtrlId] = _.get(resources, unqCtrlId, { uploads: [], active: true, saved: false });
        return resources[unqCtrlId];
      }
      return undefined;
    }

    function clearResourcesExcept(unqCtrlId, index) {
      if (index >= 0) {
        var ctrlResources = getResources(unqCtrlId);
        if (ctrlResources.uploads.length > 0) {
          var except = _.pullAt(ctrlResources.uploads, index);
          deleteResources(ctrlResources);
          ctrlResources.uploads = except;
        }
      }
    }

    function deleteResources(ctrl) {
      var target = _.get(ctrl, 'uploads', []);
      _.each(target, function (value) {
        if (_.has(value, 'value')) {
          try {
            var desc = JSON.parse(target.description);
            httpDeleteRetry(desc.deleteUrl, 0);
          } catch (exception) {
            //do nothing
          }
        }
      });
      if (target.length > 0) {
        delete ctrl.uploads;
      }
    }

    //for the time being we are attempting to retry deletes 3 times
    //if it fails after that, it's orphaned in clio
    function httpDeleteRetry(internalValue, counter) {
      var deleter = deleteRecording(internalValue);
      if (!_.isUndefined(deleter)) {
        deleter.then(function () {
        }, function () {
          if (counter < 3) {
            httpDeleteRetry(internalValue, ++counter);
          }
        });
      }
    }

    function deleteRecording(deleteUrl) {
      if (deleteUrl) {
        return $http.delete(deleteUrl);
      } else {
        return undefined;
      }
    }

    function getRecordingUrl(metadata) {
      if (metadata) {
        var variants = _.get(metadata, 'variants', undefined);
        if (variants) {
          return getRecordingByVariant(variants);
        }
      }
      return '';
    }

    function getDeleteUrl(metadata) {
      var recordingId = _.get(metadata, 'recordingId', '');
      if (recordingId) {
        return deleteBaseUrl + recordingId;
      }
      return recordingId;
    }

    function retrieveByResult(successResult) {
      if (!successResult) {
        return '';
      }
      var urls = {};
      if (isClioEnabled()) {
        if (_.has(successResult, 'data.metadata')) {
          urls.playback = getRecordingUrl(successResult.data.metadata);
          urls.deleteUrl = getDeleteUrl(successResult.data.metadata);
        }
      } else {
        if (_.has(successResult, 'data.PlaybackUri')) {
          urls.playback = deleteBaseUrl + successResult.data.PlaybackUri;
          urls.deleteUrl = '';
        }
      }
      return urls;
    }

    function getRecordingByVariant(variants) {
      var variantKeys = _.keys(variants);
      if (!variantKeys || variantKeys.length === 0) {
        return '';
      }
      var variantUrl = _.get(variants, variantKeys[0] + '.variantUrl', undefined);
      if (_.isUndefined(variantUrl)) {
        return '';
      }
      return variantUrl + '?orgId=' + Authinfo.getOrgId();
    }

    function getUploadUrl() {
      if (isClioEnabled()) {
        return uploadBaseUrl;
      } else {
        return uploadBaseUrl + '?customerId=' + Authinfo.getOrgId();
      }
    }

    function uploadByUpload(file) {
      if (file && validateFile(file.name)) {
        var uploadUrl = getUploadUrl();
        var fd = new $window.FormData();
        fd.append('file', file);
        if (isClioEnabled()) {
          fd.append('appType', CLIO_APP_TYPE);
          fd.append('policy', ENCRYPTION_POLICY);
        }
        return Upload.http({
          url: uploadUrl,
          transformRequest: _.identity,
          headers: {
            'Content-Type': undefined,
          },
          data: fd
        });
      } else {
        return undefined;
      }
    }

    function validateFile(fileName) {
      if (_.endsWith(fileName, '.wav')) {
        return true;
      } else {
        return false;
      }
    }

    function isClioEnabled() {
      setURLFromClioFeatureToggle();
      return clioEnabled;
    }

    function setURLFromClioFeatureToggle() {
      if (!uploadBaseUrl) {
        if (AACommonService.isClioToggle()) {
          if (Config.isProd()) {
            uploadBaseUrl = clioUploadBaseUrlProd;
            deleteBaseUrl = clioDeleteBaseUrlProd;
          } else {
            uploadBaseUrl = clioUploadBaseUrlInt;
            deleteBaseUrl = clioDeleteBaseUrlInt;
          }
          clioEnabled = true;
        } else {
          uploadBaseUrl = devUploadBaseUrl;
          deleteBaseUrl = 'http://';
        }
      }
    }
  }

})();
