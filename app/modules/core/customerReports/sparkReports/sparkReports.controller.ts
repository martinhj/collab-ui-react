import {
  IActiveUserData,
  IFilterObject,
  IDropdownBase,
  IReportCard,
  IReportDropdown,
  IReportLabel,
  ISecondaryReport,
  ITimespan,
} from '../../partnerReports/partnerReportInterfaces';

import {
  IActiveTableWrapper,
  IActiveUserWrapper,
  IAvgRoomData,
  IEndpointContainer,
  IEndpointWrapper,
  IFilesShared,
  IMediaData,
  IMetricsData,
  IMetricsLabel,
} from './sparkReportInterfaces';
let Masonry: any = require('masonry-layout');

class SparkReportCtrl {
  /* @ngInject */
  constructor(
    private $rootScope: ng.IRootScopeService,
    private $timeout: ng.ITimeoutService,
    private $translate: ng.translate.ITranslateService,
    private SparkGraphService,
    private SparkReportService,
    private DummySparkDataService,
    private FeatureToggleService,
    private ReportConstants,
  ) {
    this.filterArray[0].toggle = (): void => {
      this.resetCards(this.ALL);
    };
    this.filterArray[1].toggle = (): void => {
      this.resetCards(this.ENGAGEMENT);
    };
    this.filterArray[2].toggle = (): void => {
      this.resetCards(this.QUALITY);
    };

    this.reportsUpdateToggle.then((response: boolean): void => {
      this.displayActiveLineGraph = response;
      if (this.displayActiveLineGraph) {
        this.timeOptions[2].label = $translate.instant('reportsPage.threePlusMonths');
        this.secondaryActiveOptions.alternateTranslations = true;
        this.activeDropdown = {
          array: this.activeArray,
          click: (): void => {
            this.SparkGraphService.showHideActiveLineGraph(this.activeUsersChart, this.activeDropdown.selected);
          },
          disabled: true,
          selected: this.activeArray[0],
        };
      }

      this.$timeout((): void => {
        this.setDummyData();
        this.setAllGraphs();
      }, 30);
    });
  }

  private reportsUpdateToggle = this.FeatureToggleService.atlasReportsUpdateGetStatus();

  // report display filter controls
  public readonly ALL: string = this.ReportConstants.ALL;
  public readonly ENGAGEMENT: string = this.ReportConstants.ENGAGEMENT;
  public readonly QUALITY: string = this.ReportConstants.QUALITY;
  public currentFilter: string = this.ALL;
  public displayEngagement: boolean = true;
  public displayQuality: boolean = true;
  public filterArray: Array<IFilterObject> = _.cloneDeep(this.ReportConstants.filterArray);

  // Time Filter Controls
  public timeOptions: Array<ITimespan> = _.cloneDeep(this.ReportConstants.timeFilter);
  public timeSelected: ITimespan = this.timeOptions[0];

  public timeUpdate() {
    this.activeOptions.state = this.ReportConstants.REFRESH;
    this.secondaryActiveOptions.state = this.ReportConstants.REFRESH;
    this.avgRoomOptions.state = this.ReportConstants.REFRESH;
    this.filesSharedOptions.state = this.ReportConstants.REFRESH;
    this.mediaOptions.state = this.ReportConstants.REFRESH;
    this.deviceOptions.state = this.ReportConstants.REFRESH;
    this.metricsOptions.state = this.ReportConstants.REFRESH;
    this.mediaDropdown.selected = this.mediaArray[0];
    if (this.displayActiveLineGraph) {
      this.activeDropdown.selected = this.activeDropdown.array[0];
      this.activeOptions.titlePopover = this.ReportConstants.UNDEF;
      if (this.timeSelected.value === this.ReportConstants.FILTER_THREE.value) {
        this.activeOptions.titlePopover = 'activeUsers.threeMonthsMessage';
      }
    }

    this.setDummyData();
    this.setAllGraphs();
  }

  // Active User Report Controls
  private activeUsersChart: any;
  private displayActiveLineGraph: boolean = false;
  private activeArray: Array<IDropdownBase> = _.cloneDeep(this.ReportConstants.activeFilter);
  public activeDropdown: IReportDropdown;

  public activeOptions: IReportCard = {
    animate: true,
    description: 'activeUsers.customerPortalDescription',
    headerTitle: 'activeUsers.activeUsers',
    id: 'activeUsers',
    reportType: this.ReportConstants.BARCHART,
    state: this.ReportConstants.REFRESH,
    table: undefined,
    titlePopover: this.ReportConstants.UNDEF,
  };

  public secondaryActiveOptions: ISecondaryReport = {
    alternateTranslations: false,
    broadcast: 'ReportCard::UpdateSecondaryReport',
    description: 'activeUsers.customerMostActiveDescription',
    display: true,
    emptyDescription: 'activeUsers.noActiveUsers',
    errorDescription: 'activeUsers.errorActiveUsers',
    search: true,
    state: this.ReportConstants.REFRESH,
    sortOptions: [{
      option: 'userName',
      direction: false,
    }, {
      option: 'numCalls',
      direction: false,
    }, {
      option: 'sparkMessages',
      direction: true,
    }, {
      option: 'totalActivity',
      direction: true,
    }],
    table: {
      headers: [{
        title: 'activeUsers.user',
        class: 'col-md-4 pointer',
      }, {
        title: 'activeUsers.calls',
        class: 'horizontal-center col-md-2 pointer',
      }, {
        title: 'activeUsers.sparkMessages',
        class: 'horizontal-center col-md-2 pointer',
      }],
      data: [],
      dummy: false,
    },
    title: 'activeUsers.mostActiveUsers',
  };

  public resizeMostActive () {
    this.resize(0);
  }

  private setActiveGraph(data: Array<IActiveUserData>): void {
    let tempActiveUserChart: any;
    if (this.displayActiveLineGraph) {
      tempActiveUserChart = this.SparkGraphService.setActiveLineGraph(data, this.activeUsersChart, this.timeSelected);
    } else {
      tempActiveUserChart = this.SparkGraphService.setActiveUsersGraph(data, this.activeUsersChart);
    }

    if (tempActiveUserChart) {
      this.activeUsersChart = tempActiveUserChart;
      if (this.displayActiveLineGraph) {
        this.SparkGraphService.showHideActiveLineGraph(this.activeUsersChart, this.activeDropdown.selected);
      }
    }
  }

  private setActiveUserData() {
    // reset defaults
    this.secondaryActiveOptions.table.data = [];
    this.$rootScope.$broadcast(this.secondaryActiveOptions.broadcast);
    if (this.displayActiveLineGraph) {
      this.activeDropdown.disabled = true;
    }

    this.SparkReportService.getActiveUserData(this.timeSelected, this.displayActiveLineGraph).then((response: IActiveUserWrapper): void => {
      if (_.isArray(response.graphData) && response.graphData.length === 0) {
        this.activeOptions.state = this.ReportConstants.EMPTY;
      } else {
        this.setActiveGraph(response.graphData);
        this.activeOptions.state = this.ReportConstants.SET;

        if (this.displayActiveLineGraph) {
          this.activeDropdown.disabled = !response.isActiveUsers;
        }
      }
      this.resize(0);
    });

    this.SparkReportService.getMostActiveUserData(this.timeSelected).then((response: IActiveTableWrapper): void => {
      if (response.error) {
        this.secondaryActiveOptions.state = this.ReportConstants.ERROR;
      } else if (response.tableData.length === 0) {
        this.secondaryActiveOptions.state = this.ReportConstants.EMPTY;
      } else {
        this.secondaryActiveOptions.state = this.ReportConstants.SET;
      }
      this.secondaryActiveOptions.table.data = response.tableData;
      this.$rootScope.$broadcast(this.secondaryActiveOptions.broadcast);
    });
  }

  // Average Rooms Report Controls
  private avgRoomsChart: any;
  public avgRoomOptions: IReportCard = {
    animate: true,
    description: 'avgRooms.avgRoomsDescription',
    headerTitle: 'avgRooms.avgRooms',
    id: 'avgRooms',
    reportType: this.ReportConstants.BARCHART,
    state: this.ReportConstants.REFRESH,
    table: undefined,
    titlePopover: this.ReportConstants.UNDEF,
  };

  private setAverageGraph(data: Array<IAvgRoomData>): void {
    let tempAvgRoomsChart: any = this.SparkGraphService.setAvgRoomsGraph(data, this.avgRoomsChart);
    if (tempAvgRoomsChart) {
      this.avgRoomsChart = tempAvgRoomsChart;
    }
  }

  private setAvgRoomData() {
    this.SparkReportService.getAvgRoomData(this.timeSelected).then((response: Array<IAvgRoomData>): void => {
      if (response.length === 0) {
        this.avgRoomOptions.state = this.ReportConstants.EMPTY;
      } else {
        this.setAverageGraph(response);
        this.avgRoomOptions.state = this.ReportConstants.SET;
      }
    });
  }

  // Files Shared Report Controls
  private filesSharedChart: any;
  public filesSharedOptions: IReportCard = {
    animate: true,
    description: 'filesShared.filesSharedDescription',
    headerTitle: 'filesShared.filesShared',
    id: 'filesShared',
    reportType: this.ReportConstants.BARCHART,
    state: this.ReportConstants.REFRESH,
    table: undefined,
    titlePopover: this.ReportConstants.UNDEF,
  };

  private setFilesGraph(data: Array<IFilesShared>): void {
    let tempFilesSharedChart: any = this.SparkGraphService.setFilesSharedGraph(data, this.filesSharedChart);
    if (tempFilesSharedChart) {
      this.filesSharedChart = tempFilesSharedChart;
    }
  }

  private setFilesSharedData() {
    this.SparkReportService.getFilesSharedData(this.timeSelected).then((response: Array<IFilesShared>): void => {
      if (response.length === 0) {
        this.filesSharedOptions.state = this.ReportConstants.EMPTY;
      } else {
        this.setFilesGraph(response);
        this.filesSharedOptions.state = this.ReportConstants.SET;
      }
    });
  }

  // Media Quality Report Controls
  private mediaChart: any;
  private mediaData: Array<IMediaData> = [];
  private mediaArray: Array<IDropdownBase> = _.cloneDeep(this.ReportConstants.mediaFilter);

  public mediaOptions: IReportCard = {
    animate: true,
    description: 'mediaQuality.descriptionCustomer',
    headerTitle: 'mediaQuality.mediaQuality',
    id: 'mediaQuality',
    reportType: this.ReportConstants.BARCHART,
    state: this.ReportConstants.REFRESH,
    table: undefined,
    titlePopover: 'mediaQuality.packetLossDefinition',
  };
  public mediaDropdown: IReportDropdown = {
    array: this.mediaArray,
    click: (): void => {
      this.setMediaGraph(this.mediaData);
    },
    disabled: true,
    selected: this.mediaArray[0],
  };

  private setMediaGraph(data: Array<IMediaData>): void {
    let tempMediaChart: any = this.SparkGraphService.setMediaQualityGraph(data, this.mediaChart, this.mediaDropdown.selected);
    if (tempMediaChart) {
      this.mediaChart = tempMediaChart;
    }
  }

  private setMediaData() {
    this.mediaDropdown.disabled = true;
    this.mediaData = [];
    this.SparkReportService.getMediaQualityData(this.timeSelected).then((response: Array<IMediaData>): void => {
      if (response.length === 0) {
        this.mediaOptions.state = this.ReportConstants.EMPTY;
      } else {
        this.mediaData = response;
        this.setMediaGraph(this.mediaData);
        this.mediaOptions.state = this.ReportConstants.SET;
        this.mediaDropdown.disabled = false;
      }
    });
  }

  // Registered Endpoints Report Controls
  private deviceChart: any;
  private currentDeviceGraphs: Array<IEndpointWrapper> = [];
  private defaultDeviceFilter: IDropdownBase = {
    value: 0,
    label: this.$translate.instant('registeredEndpoints.allDevices'),
  };

  public deviceOptions: IReportCard = {
    animate: true,
    description: 'registeredEndpoints.customerDescription',
    headerTitle: 'registeredEndpoints.registeredEndpoints',
    id: 'devices',
    reportType: this.ReportConstants.BARCHART,
    state: this.ReportConstants.REFRESH,
    table: undefined,
    titlePopover: this.ReportConstants.UNDEF,
  };

  public deviceDropdown: IReportDropdown = {
    array: [this.defaultDeviceFilter],
    click: (): void => {
      if (this.currentDeviceGraphs[this.deviceDropdown.selected.value].emptyGraph) {
        this.setDeviceGraph(this.DummySparkDataService.dummyDeviceData(this.timeSelected), undefined);
        this.deviceOptions.state = this.ReportConstants.EMPTY;
      } else {
        this.setDeviceGraph(this.currentDeviceGraphs, this.deviceDropdown.selected);
        this.deviceOptions.state = this.ReportConstants.SET;
      }
    },
    disabled: true,
    selected: this.defaultDeviceFilter,
  };

    private setDeviceGraph(data: Array<IEndpointWrapper>, deviceFilter: IDropdownBase | undefined) {
      let tempDevicesChart: any = this.SparkGraphService.setDeviceGraph(data, this.deviceChart, deviceFilter);
      if (tempDevicesChart) {
        this.deviceChart = tempDevicesChart;
      }
    }

    private setDeviceData() {
      this.deviceDropdown.array = [this.defaultDeviceFilter];
      this.deviceDropdown.selected = this.deviceDropdown.array[0];
      this.currentDeviceGraphs = [];
      this.deviceDropdown.disabled = true;

      this.SparkReportService.getDeviceData(this.timeSelected).then((response: IEndpointContainer): void => {
        if (response.filterArray.length) {
          this.deviceDropdown.array = response.filterArray.sort((a: IDropdownBase, b: IDropdownBase): number => {
            if (a.label) {
              return a.label.localeCompare(b.label);
            } else if (a > b) {
              return 1;
            } else {
              return 0;
            }
          });
        }
        this.deviceDropdown.selected = this.deviceDropdown.array[0];
        this.currentDeviceGraphs = response.graphData;

        if (this.currentDeviceGraphs.length && !this.currentDeviceGraphs[this.deviceDropdown.selected.value].emptyGraph) {
          this.setDeviceGraph(this.currentDeviceGraphs, this.deviceDropdown.selected);
          this.deviceOptions.state = this.ReportConstants.SET;
          this.deviceDropdown.disabled = false;
        } else {
          this.deviceOptions.state = this.ReportConstants.EMPTY;
        }
      });
    }

  // Call Metrics Report Controls
  private metricsChart: any;
  public metricsOptions: IReportCard = {
    animate: false,
    description: 'callMetrics.customerDescription',
    headerTitle: 'callMetrics.callMetrics',
    id: 'callMetrics',
    reportType: this.ReportConstants.DONUT,
    state: this.ReportConstants.REFRESH,
    table: undefined,
    titlePopover: this.ReportConstants.UNDEF,
  };

  public metricsLabels: Array<IReportLabel> = [{
    number: 0,
    text: 'callMetrics.totalCalls',
  }, {
    number: 0,
    text: 'callMetrics.callMinutes',
  }, {
    number: 0,
    text: 'callMetrics.failureRate',
  }];

  private setMetricGraph(data: IMetricsData): void {
    let tempMetricsChart: any = this.SparkGraphService.setMetricsGraph(data, this.metricsChart);
    if (tempMetricsChart) {
      this.metricsChart = tempMetricsChart;
    }
  }

  private setMetrics(data: IMetricsLabel | undefined): void {
    if (data) {
      this.metricsLabels[0].number = data.totalCalls;
      this.metricsLabels[1].number = data.totalAudioDuration;
      this.metricsLabels[2].number = data.totalFailedCalls;
    } else {
      _.forEach(this.metricsLabels, (label: IReportLabel): void => {
        label.number = 0;
      });
    }
  }

  private setCallMetricsData(): void {
    this.SparkReportService.getCallMetricsData(this.timeSelected).then((response: IMetricsData): void => {
      this.metricsOptions.state = this.ReportConstants.EMPTY;
      if (_.isArray(response.dataProvider) && response.displayData) {
        this.setMetricGraph(response);
        this.setMetrics(response.displayData);
        this.metricsOptions.state = this.ReportConstants.SET;
      }
    });
  }

  // Helper Functions
  private resetCards(filter: string): void {
    if (this.currentFilter !== filter) {
      this.displayEngagement = false;
      this.displayQuality = false;
      if (filter === this.ALL || filter === this.ENGAGEMENT) {
        this.displayEngagement = true;
      }
      if (filter === this.ALL || filter === this.QUALITY) {
        this.displayQuality = true;
      }
      this.resize(500);
      this.currentFilter = filter;
    }
  }

  private resize(delay: number): void {
    this.$timeout((): void => {
      const $cardlayout = new Masonry('.cs-card-layout', {
        itemSelector: '.cs-card',
        columnWidth: '.cs-card',
        resize: true,
        percentPosition: true,
      });
      $cardlayout.layout();
    }, delay);
  }

  public setAllGraphs(): void {
    this.setActiveUserData();
    this.setAvgRoomData();
    this.setFilesSharedData();
    this.setMediaData();
    this.setCallMetricsData();
    this.setDeviceData();
  }

  public setDummyData(): void {
    this.setActiveGraph(this.DummySparkDataService.dummyActiveUserData(this.timeSelected, this.displayActiveLineGraph));
    this.setAverageGraph(this.DummySparkDataService.dummyAvgRoomData(this.timeSelected));
    this.setFilesGraph(this.DummySparkDataService.dummyFilesSharedData(this.timeSelected));
    this.setMetrics(undefined);
    this.setMetricGraph(this.DummySparkDataService.dummyMetricsData());
    this.setDeviceGraph(this.DummySparkDataService.dummyDeviceData(this.timeSelected), undefined);
    this.setMediaGraph(this.DummySparkDataService.dummyMediaData(this.timeSelected));

    this.resize(0);
  }
}

angular
  .module('Core')
  .controller('SparkReportCtrl', SparkReportCtrl);