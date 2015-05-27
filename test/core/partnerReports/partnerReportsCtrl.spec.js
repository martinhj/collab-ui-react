'use strict';

describe('Controller: Partner Reports', function () {
  var controller, $scope, $q, $translate, PartnerReportService, GraphService, DonutChartService;
  var date = "March 17, 2015";
  var activeUsersSort = ['userName', 'orgName', 'numCalls', 'totalActivity'];
  var dummyCustomers = getJSONFixture('core/json/partnerReports/customerResponse.json');
  var dummyGraphData = getJSONFixture('core/json/partnerReports/dummyGraphData.json');
  var dummyTableData = getJSONFixture('core/json/partnerReports/dummyTableData.json');
  var dummyMediaQualityGraphData = getJSONFixture('core/json/partnerReports/mediaQualityGraphData.json');
  var activeUsersChart;
  var mediaQualityChart;
  var validateService = {
    invalidate: function () {}
  };
  var callMetricsData = getJSONFixture('core/json/partnerReports/callMetricsData.json');

  var customerOptions = [{
    value: 'a7cba512-7b62-4f0a-a869-725b413680e4',
    label: 'Test Org One'
  }, {
    value: 'b7e25333-6750-4b17-841c-ce5124f8ddbb',
    label: 'Test Org Two'
  }, {
    value: '1896f9dc-c5a4-4041-8257-b3adfe3cf9a4',
    label: 'Test Org Three'
  }];

  beforeEach(module('Core'));

  describe('PartnerReportCtrl - Expected Responses', function () {
    beforeEach(inject(function ($rootScope, $controller, _$q_, _$translate_, _PartnerReportService_, _GraphService_, _DonutChartService_) {
      $scope = $rootScope.$new();
      $q = _$q_;
      $translate = _$translate_;
      PartnerReportService = _PartnerReportService_;
      GraphService = _GraphService_;
      DonutChartService = _DonutChartService_;

      spyOn(PartnerReportService, 'getActiveUserData').and.returnValue($q.when({
        graphData: dummyGraphData,
        tableData: dummyTableData
      }));
      spyOn(PartnerReportService, 'getCustomerList').and.returnValue($q.when(dummyCustomers));
      spyOn(PartnerReportService, 'getMostRecentUpdate').and.returnValue(date);
      spyOn(PartnerReportService, 'getMediaQualityMetrics').and.returnValue($q.when(dummyMediaQualityGraphData));
      spyOn(PartnerReportService, 'getCallMetricsData').and.returnValue($q.when({
        data: callMetricsData
      }));

      spyOn(GraphService, 'updateActiveUsersGraph');
      spyOn(GraphService, 'createActiveUsersGraph').and.returnValue({
        'dataProvider': dummyGraphData,
        invalidateSize: validateService.invalidate
      });

      activeUsersChart = GraphService.createActiveUsersGraph(dummyGraphData);

      spyOn(GraphService, 'updateMediaQualityGraph');
      spyOn(GraphService, 'createMediaQualityGraph').and.returnValue({
        'dataProvider': dummyMediaQualityGraphData,
        invalidateSize: validateService.invalidate
      });

      mediaQualityChart = GraphService.createMediaQualityGraph(dummyMediaQualityGraphData);

      spyOn(DonutChartService, 'createCallMetricsDonutChart').and.returnValue({
        invalidateSize: validateService.invalidate
      });
      spyOn(DonutChartService, 'updateCallMetricsDonutChart');

      controller = $controller('PartnerReportCtrl', {
        $scope: $scope,
        $translate: $translate,
        $q: $q,
        PartnerReportService: PartnerReportService,
        GraphService: GraphService,
        DonutChartService: DonutChartService
      });
      $scope.$apply();
    }));

    describe('Initializing Controller', function () {
      it('should be created successfully and all expected calls completed', function () {
        expect(controller).toBeDefined();

        expect(PartnerReportService.getActiveUserData).toHaveBeenCalled();
        expect(PartnerReportService.getCustomerList).toHaveBeenCalled();
        expect(PartnerReportService.getMediaQualityMetrics).toHaveBeenCalled();
        expect(GraphService.createActiveUsersGraph).toHaveBeenCalled();
        expect(GraphService.createMediaQualityGraph).toHaveBeenCalled();
        expect(DonutChartService.createCallMetricsDonutChart).toHaveBeenCalled();
      });

      it('should set all page variables', function () {
        expect(controller.activeUsersRefresh).toEqual('set');
        expect(controller.showMostActiveUsers).toBeFalsy();
        expect(controller.activeUserReverse).toBeTruthy();
        expect(controller.activeUsersTotalPages).toEqual(1);
        expect(controller.activeUserCurrentPage).toEqual(1);
        expect(controller.activeUserPredicate).toEqual(activeUsersSort[3]);
        expect(controller.activeButton).toEqual([1, 2, 3]);
        expect(controller.mostActiveUsers).toEqual(dummyTableData);

        expect(controller.recentUpdate).toEqual(date);
        expect(controller.customerOptions).toEqual(customerOptions);
        expect(controller.customerSelected).toEqual(customerOptions[0]);
        expect(controller.timeSelected).toEqual(controller.timeOptions[0]);
      });
    });

    describe('activePage', function () {
      it('should return true when called with the same value as activeUserCurrentPage', function () {
        expect(controller.activePage(1)).toBeTruthy();
      });

      it('should return false when called with a different value as activeUserCurrentPage', function () {
        expect(controller.activePage(3)).toBeTruthy();
      });
    });

    describe('changePage', function () {
      it('should change the value of activeUserCurrentPage', function () {
        controller.changePage(3);
        expect(controller.activeUserCurrentPage).toEqual(3);
      });
    });

    describe('isRefresh', function () {
      it('should return true when sent "refresh"', function () {
        expect(controller.isRefresh('refresh')).toBeTruthy();
      });

      it('should return false when sent "set" or "empty"', function () {
        expect(controller.isRefresh('set')).toBeFalsy();
        expect(controller.isRefresh('empty')).toBeFalsy();
      });
    });

    describe('isEmpty', function () {
      it('should return true when sent "empty"', function () {
        expect(controller.isEmpty('empty')).toBeTruthy();
      });

      it('should return false when sent "set" or "refresh"', function () {
        expect(controller.isEmpty('set')).toBeFalsy();
        expect(controller.isEmpty('refresh')).toBeFalsy();
      });
    });

    describe('mostActiveSort', function () {
      it('should sort by userName', function () {
        controller.mostActiveSort(0);
        expect(controller.activeUserPredicate).toBe(activeUsersSort[0]);
        expect(controller.activeUserReverse).toBeFalsy();
      });

      it('should sort by orgName', function () {
        controller.mostActiveSort(1);
        expect(controller.activeUserPredicate).toBe(activeUsersSort[1]);
        expect(controller.activeUserReverse).toBeFalsy();
      });

      it('should sort by calls', function () {
        controller.mostActiveSort(2);
        expect(controller.activeUserPredicate).toBe(activeUsersSort[2]);
        expect(controller.activeUserReverse).toBeTruthy();
      });

      it('should sort by posts', function () {
        controller.mostActiveSort(3);
        expect(controller.activeUserPredicate).toBe(activeUsersSort[3]);
        expect(controller.activeUserReverse).toBeFalsy();
      });
    });

    describe('pageForward', function () {
      it('should change carousel button numbers', function () {
        controller.activeUsersTotalPages = 4;
        controller.activeUserCurrentPage = controller.activeButton[2];
        controller.pageForward();
        expect(controller.activeButton[0]).toBe(2);
        expect(controller.activeButton[1]).toBe(3);
        expect(controller.activeButton[2]).toBe(4);
      });

      it('should not change carousel button numbers', function () {
        controller.activeUsersTotalPages = 3;
        controller.activeUserCurrentPage = controller.activeButton[2];
        controller.pageForward();
        expect(controller.activeButton[0]).toBe(1);
        expect(controller.activeButton[1]).toBe(2);
        expect(controller.activeButton[2]).toBe(3);
      });
    });

    describe('pageBackward', function () {
      it('should change carousel button numbers', function () {
        controller.activeButton[0] = 2;
        controller.activeButton[1] = 3;
        controller.activeButton[2] = 4;
        controller.activeUserCurrentPage = 2;

        controller.pageBackward();
        expect(controller.activeButton[0]).toBe(1);
        expect(controller.activeButton[1]).toBe(2);
        expect(controller.activeButton[2]).toBe(3);
      });

      it('should not change carousel button numbers', function () {
        controller.pageBackward();
        expect(controller.activeButton[0]).toBe(1);
        expect(controller.activeButton[1]).toBe(2);
        expect(controller.activeButton[2]).toBe(3);
      });
    });

    describe('updateReports', function () {
      it('should call updateActiveUsersGraph when updateReports is called', function () {
        controller.updateReports();
        $scope.$apply();

        expect(GraphService.updateActiveUsersGraph).toHaveBeenCalled();
      });
    });
  });

  describe('PartnerReportCtrl - loading failed', function () {
    beforeEach(inject(function ($rootScope, $controller, _$q_, _$translate_, _PartnerReportService_, _GraphService_, _DonutChartService_) {
      $scope = $rootScope.$new();
      $q = _$q_;
      $translate = _$translate_;
      PartnerReportService = _PartnerReportService_;
      GraphService = _GraphService_;
      DonutChartService = _DonutChartService_;

      spyOn(PartnerReportService, 'getActiveUserData').and.returnValue($q.when({
        graphData: [],
        tableData: []
      }));
      spyOn(PartnerReportService, 'getCustomerList').and.returnValue($q.when([]));
      spyOn(PartnerReportService, 'getMostRecentUpdate').and.returnValue(undefined);
      spyOn(PartnerReportService, 'getMediaQualityMetrics').and.returnValue($q.when(dummyMediaQualityGraphData));

      spyOn(PartnerReportService, 'getCallMetricsData').and.returnValue($q.when({
        data: callMetricsData
      }));
      spyOn(GraphService, 'updateActiveUsersGraph');
      spyOn(GraphService, 'createActiveUsersGraph').and.returnValue({
        'dataProvider': dummyGraphData,
        invalidateSize: validateService.invalidate
      });
      activeUsersChart = GraphService.createActiveUsersGraph(dummyGraphData);

      spyOn(GraphService, 'updateMediaQualityGraph');
      spyOn(GraphService, 'createMediaQualityGraph').and.returnValue({
        'dataProvider': dummyMediaQualityGraphData,
        invalidateSize: validateService.invalidate
      });

      mediaQualityChart = GraphService.createMediaQualityGraph(dummyMediaQualityGraphData);
      spyOn(DonutChartService, 'createCallMetricsDonutChart');

      controller = $controller('PartnerReportCtrl', {
        $scope: $scope,
        $translate: $translate,
        $q: $q,
        PartnerReportService: PartnerReportService,
        GraphService: GraphService,
        DonutChartService: DonutChartService
      });
      $scope.$apply();
    }));

    describe('Initializing Controller', function () {
      it('should be created successfully and all expected calls completed', function () {
        expect(controller).toBeDefined();

        expect(PartnerReportService.getActiveUserData).toHaveBeenCalled();
        expect(PartnerReportService.getCustomerList).toHaveBeenCalled();
        expect(PartnerReportService.getMediaQualityMetrics).toHaveBeenCalled();

        expect(GraphService.createActiveUsersGraph).toHaveBeenCalled();

        expect(GraphService.createMediaQualityGraph).toHaveBeenCalled();
        expect(DonutChartService.createCallMetricsDonutChart).toHaveBeenCalled();
      });

      it('should set all page variables empty defaults', function () {
        expect(controller.activeUsersRefresh).toEqual('empty');
        expect(controller.mostActiveUsers).toEqual([]);

        expect(controller.customerOptions).toEqual([]);
        expect(controller.customerSelected).toEqual({
          value: 0,
          label: ''
        });
        expect(controller.timeSelected).toEqual(controller.timeOptions[0]);
      });
    });
  });
});
