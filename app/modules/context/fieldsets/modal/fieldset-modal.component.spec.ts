import fieldsetModule from './fieldset-modal.component';

describe('Component: context fieldset modal', () => {

  let fieldsetServiceCreateSpy, fieldServiceSpy, fieldsetServiceUpdateSpy;
  let formIsSetDirty;

  const mockedFieldset = {
    id: 'id',
  };

  const mockedUpdateFieldset = {
    id: 'id',
    data: 'someData',
  };

  const mockedFields = [{
    id: 'field1',
    description: 'desc1',
    classification: 'unencrypted',
    dataType: 'string',
    fieldInfo: '',
    publiclyAccessible: true,
    translations: '',
    searchable: true,
    refUrl: '',
    lastUpdated: '',
  }, {
    id: 'field2',
    description: 'desc2',
    classification: 'unencrypted',
    dataType: 'string',
    fieldInfo: '',
    publiclyAccessible: true,
    translations: '',
    searchable: true,
    refUrl: '',
    lastUpdated: '',
  }, {
    id: 'field3',
    description: 'desc3',
    classification: 'unencrypted',
    dataType: 'boolean',
    fieldInfo: '',
    publiclyAccessible: true,
    translations: '',
    searchable: true,
    refUrl: '',
    lastUpdated: '',
  }];

  beforeEach(function () {
    this.initModules('Core', 'Huron', 'Context', fieldsetModule);
    this.injectDependencies(
      '$q',
      '$scope',
      '$translate',
      'Analytics',
      'ContextFieldsetsService',
      'ContextFieldsService',
      'Notification',
    );
    spyOn(this.$translate, 'instant').and.callThrough();
    spyOn(this.Notification, 'success');
    spyOn(this.Notification, 'error');
    spyOn(this.Analytics, 'trackEvent');
    fieldsetServiceCreateSpy = spyOn(this.ContextFieldsetsService, 'createAndGetFieldset').and.returnValue(this.$q.resolve(mockedFieldset));
    fieldServiceSpy = spyOn(this.ContextFieldsService, 'getFields').and.returnValue(this.$q.resolve(mockedFields));
    fieldsetServiceUpdateSpy = spyOn(this.ContextFieldsetsService, 'updateAndGetFieldset').and.returnValue(this.$q.resolve(mockedUpdateFieldset));

    this.$scope.callback = jasmine.createSpy('callback');
    this.$scope.dismiss = jasmine.createSpy('dismiss');
    this.$scope.existingFieldsetIds = [];
    this.$scope.existingFieldsetData = {};

    formIsSetDirty = false;
    this.$scope.fieldsetForm = {
      $setDirty: function () {
        formIsSetDirty = true;
      },
      $valid: true,
    };

    this.compileComponent('context-fieldset-modal', {
      existingFieldsetIds: 'existingFieldsetIds',
      existingFieldsetData: 'existingFieldsetData',
      callback: 'callback()',
      dismiss: 'dismiss()',
    });
  });

  describe('invalidCharactersValidation', function () {
    it('should return true for valid values', function () {
      ['someFieldset', 'some-fieldset', 'some_fieldset'].forEach(testString => {
        expect(this.controller.invalidCharactersValidation(testString)).toBe(true);
      });
    });

    it('should return false for values with invalid characters', function () {
      ['!', '$', '%', '!@#$%^', 'some fieldset', 'some_*-fieldset'].forEach(testString => {
        expect(this.controller.invalidCharactersValidation(testString)).toBe(false);
      });
    });
  });

  describe('uniqueIdValidation', function () {
    it('should return true if the fieldset id has not be used', function () {
      ['someFieldset', 'some-fieldset', 'some_fieldset'].forEach(testString => {
        expect(this.controller.uniqueIdValidation(testString)).toBe(true);
      });
    });

    it('should return false if the fieldset id has already been used', function () {
      this.$scope.existingFieldsetIds.push('someFieldset');
      this.$scope.existingFieldsetIds.push('some-fieldset');
      this.$scope.existingFieldsetIds.push('some_fieldset');
      ['someFieldset', 'some-fieldset', 'some_fieldset'].forEach(testString => {
        expect(this.controller.uniqueIdValidation(testString)).toBe(false);
      });
    });
  });

  describe('nextButtonEnabled', function () {
    it('should return true if id is valid', function () {
      this.controller.fieldsetData.id = 'someId';
      expect(this.controller.nextButtonEnabled()).toBe(true);
    });

    it('should return false if id has not been entered', function () {
      this.controller.fieldsetData.id = '';
      expect(this.controller.nextButtonEnabled()).toBe(false);
    });

    it('should return false if id contains invalid characters', function () {
      ['!', '$', '%', '!@#$%^', 'some fieldset', 'some_*-fieldset'].forEach(testString => {
        this.controller.fieldsetData.id = testString;
        expect(this.controller.nextButtonEnabled()).toBe(false);
      });
    });

    it('should return false if the fieldset id has already been used', function () {
      this.$scope.existingFieldsetIds.push('someFieldset');
      this.$scope.existingFieldsetIds.push('some-fieldset');
      this.$scope.existingFieldsetIds.push('some_fieldset');
      ['someFieldset', 'some-fieldset', 'some_fieldset'].forEach(testString => {
        this.controller.fieldsetData.id = testString;
        expect(this.controller.nextButtonEnabled()).toBe(false);
      });
    });
  });

  describe('createOrSaveButtonEnabled', function () {
    it('should return true if fieldset contains a field', function () {
      this.controller.fieldsetData.id = 'someId';
      this.controller.fieldsetData.fields = ['abc'];
      expect(this.controller.createOrSaveButtonEnabled()).toBe(true);
    });

    it('should return false if no field is selected', function () {
      this.controller.fieldsetData.id = 'someId';
      this.controller.fieldsetData.fields = [];
      expect(this.controller.createOrSaveButtonEnabled()).toBe(false);
    });

    it('should return false if actionInProgress is true', function () {
      this.controller.actionInProgress = true;
      expect(this.controller.createOrSaveButtonEnabled()).toBe(false);
    });
  });

  describe('switchToPage', function () {
    it('should switch to field page when pagenumber is 2', function () {
      this.controller.switchToPage(2);
      expect(this.controller.isAttributesPage).toBe(false);
    });
    it('should switch to attributes page when pageNumber is 1', function () {
      this.controller.switchToPage(1);
      expect(this.controller.isAttributesPage).toBe(true);
    });
    it('should switch to attributes page when pageNumber is not provided', function () {
      this.controller.switchToPage();
      expect(this.controller.isAttributesPage).toBe(true);
    });
    it('should switch to attributes page when a non-existing page number is provided', function () {
      this.controller.switchToPage(100);
      expect(this.controller.isAttributesPage).toBe(true);
    });
  });

  describe('processedFields', function () {
    it('should correctly update the fieldInfo', function () {
      this.controller.fieldsetData = { id: '', description: '', fields: ['field1', 'field2'] };
      let unprocessedFields = [{
        id: 'field1',
        description: 'desc1',
        classification: 'unencrypted',
        dataType: 'string',
        publiclyAccessible: 'true',
        translations: '',
        searchable: true,
        refUrl: '',
        lastUpdated: '',
      }];
      let processedFields = this.controller.processedFields(unprocessedFields);
      expect(processedFields[0].classification).toBe('context.dictionary.fieldPage.unencrypted');
      expect(processedFields[0].fieldInfo).toBe('context.dictionary.fieldPage.unencrypted, String');
    });
    it('should return empty list when empty list is provided', function () {
      expect(this.controller.processedFields([]).length).toBe(0);
    });
  });

  describe('loadFields', function () {
    it('should load the fields and process them', function () {
      this.controller.loadFields();
      expect(this.controller.allSelectableFields.length).toBe(3);
      expect(this.controller.allSelectableFields[0].classification).toEqual('context.dictionary.fieldPage.unencrypted');
      expect(this.controller.allSelectableFields[0].fieldInfo).toEqual('context.dictionary.fieldPage.unencrypted, String');
    });
  });

  describe('getSelectedFields', function () {
    it('should return selected fields list', function () {
      this.controller.fieldsetData = { id: '', description: '', fields: ['field2', 'field3'] };
      let selectedFields = this.controller.getSelectedFields(mockedFields);
      expect(selectedFields[0].id).toBe('field2');
      expect(selectedFields[0].description).toBe('desc2');
      expect(selectedFields[0].classification).toBe('context.dictionary.fieldPage.unencrypted');
      expect(selectedFields[0].dataType).toBe('String');
      expect(selectedFields[0].publiclyAccessible).toBe(true);
      expect(selectedFields[0].searchable).toBe(true);

      expect(selectedFields[1].id).toBe('field3');
      expect(selectedFields[1].description).toBe('desc3');
      expect(selectedFields[1].classification).toBe('context.dictionary.fieldPage.unencrypted');
      expect(selectedFields[1].dataType).toBe('Boolean');
      expect(selectedFields[1].publiclyAccessible).toBe(true);
      expect(selectedFields[1].searchable).toBe(true);
    });
    it('should return empty selected fields list when no fields are selected', function () {
      this.controller.fieldsetData = { id: '', description: '', fields: [] };
      expect(this.controller.getSelectedFields(mockedFields)).toEqual([]);
    });
  });

  describe('selectField', function () {
    it('should add the field to the selected fields', function () {
      this.controller.fieldsetData = { id: '', description: '', fields: [] };
      this.controller.selectField({
        id: 'field1',
        description: 'desc1',
        classification: 'context.dictionary.fieldPage.unencrypted',
        dataType: 'String',
        fieldInfo: 'context.dictionary.fieldPage.unencrypted, String',
        publiclyAccessible: 'true',
        translations: '',
        searchable: true,
        refUrl: '',
        lastUpdated: '',
      }, this.$scope.form);
      expect(this.controller.fieldsetData.fields).toContain('field1');
    });
  });

  describe('removeFieldFromList', function () {
    it('should remove the field from the selected fields', function () {
      this.controller.fieldsetData = { id: '', description: '', fields: ['field1', 'field2'] };
      this.controller.removeFieldFromList({
        id: 'field2',
        description: 'desc1',
        classification: 'context.dictionary.fieldPage.unencrypted',
        dataType: 'String',
        fieldInfo: 'context.dictionary.fieldPage.unencrypted, String',
        publiclyAccessible: 'true',
        translations: '',
        searchable: true,
        refUrl: '',
        lastUpdated: '',
      }, this.$scope.fieldsetForm);
      expect(this.controller.fieldsetData.fields).not.toContain('field2');
      expect(formIsSetDirty).toBe(true);
    });
  });

  describe('create', function () {
    it('should correctly create a new fieldset', function (done) {
      let callbackCalled = false;
      let dismissCalled = false;
      this.controller.callback = function (fieldset) {
        expect(fieldset).toEqual(mockedFieldset);
        callbackCalled = true;
      };
      this.controller.dismiss = function () {
        dismissCalled = true;
      };
      expect(this.controller.actionInProgress).toBe(false);
      this.controller.create().then(() => {
        expect(callbackCalled).toBe(true);
        expect(dismissCalled).toBe(true);
        expect(this.Notification.success).toHaveBeenCalledWith('context.dictionary.fieldsetPage.fieldsetCreateSuccess');
        expect(this.Analytics.trackEvent).toHaveBeenCalled();
        done();
      }).catch(done.fail);
      this.$scope.$apply();
    });

    it('should reject if create fails', function (done) {
      fieldsetServiceCreateSpy.and.returnValue(this.$q.reject('error'));
      this.controller.create().then(() => {
        expect(this.Notification.error).toHaveBeenCalledWith('context.dictionary.fieldsetPage.fieldsetCreateFailure');
        expect(this.Analytics.trackEvent).toHaveBeenCalled();
        done();
      }).catch(done.fail);
      this.$scope.$apply();
    });
  });

  describe('update', function () {
    it('should correctly update the fieldset, call the callback function, and should not call the dismiss function', function (done) {
      let callbackCalled = false;
      let dismissCalled = false;
      this.controller.callback = function (fieldset) {
        expect(fieldset).toEqual(mockedUpdateFieldset);
        callbackCalled = true;
      };
      this.controller.dismiss = function () {
        dismissCalled = true;
      };
      this.controller.update().then(() => {
        //make sure the fieldsetDta of the controller is copied from the returned data
        expect(this.controller.fieldsetData).toEqual(mockedUpdateFieldset);
        expect(callbackCalled).toBe(true);
        expect(dismissCalled).toBe(false);
        expect(this.Notification.success).toHaveBeenCalledWith('context.dictionary.fieldsetPage.fieldsetUpdateSuccess');
        expect(this.Analytics.trackEvent).toHaveBeenCalled();
        done();
      }).catch(done.fail);
      this.$scope.$apply();
    });

    it('should reject if update fails', function (done) {
      fieldsetServiceUpdateSpy.and.returnValue(this.$q.reject('error'));
      this.controller.update().then(() => {
        expect(this.Notification.error).toHaveBeenCalledWith('context.dictionary.fieldsetPage.fieldsetUpdateFailure');
        expect(this.Analytics.trackEvent).toHaveBeenCalled();
        done();
      }).catch(done.fail);
      this.$scope.$apply();
    });
  });
});
