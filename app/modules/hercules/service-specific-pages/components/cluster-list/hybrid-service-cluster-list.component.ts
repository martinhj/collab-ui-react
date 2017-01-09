interface clusterIdStateParam extends ng.ui.IStateParamsService {
    clusterId?: any;
}

interface gridApiScope extends ng.IScope {
    gridApi?: any;
}

class HybridServiceClusterListCtrl implements ng.IComponentController {

    public clusterList: any = {};
    public clusterListGridOptions = {};
    public getSeverity = this.ClusterService.getRunningStateSeverity;

    private serviceId: string;
    private connectorType: string;

    /* @ngInject */
    constructor(
        private $translate: ng.translate.ITranslateService,
        private $scope: gridApiScope,
        private $state: ng.ui.IStateService,
        private $stateParams: clusterIdStateParam,
        private ClusterService,
        private FusionClusterService,
        private FusionUtils,
        private ServiceStateChecker,
    ) {  }

    public $onInit() {
        this.connectorType = this.FusionUtils.serviceId2ConnectorType(this.serviceId);
        this.ServiceStateChecker.checkState(this.connectorType, this.serviceId);
        this.clusterList = this.ClusterService.getClustersByConnectorType(this.connectorType);

        this.clusterListGridOptions = {
            data: '$ctrl.clusterList',
            enableSorting: false,
            multiSelect: false,
            enableRowHeaderSelection: false,
            enableColumnResize: true,
            enableColumnMenus: false,
            rowHeight: 75,
            columnDefs: [{
                field: 'name',
                displayName: this.$translate.instant(`hercules.clusterListComponent.clusters-title-${this.serviceId}`),
                cellTemplate: 'modules/hercules/service-specific-pages/components/cluster-list/cluster-list-display-name.html',
                width: '35%',
            }, {
                field: 'serviceStatus',
                displayName: this.$translate.instant('hercules.clusterListComponent.status-title'),
                cellTemplate: 'modules/hercules/service-specific-pages/components/cluster-list/cluster-list-status.html',
                width: '65%',
            }],
            onRegisterApi: (gridApi) => {
                this.$scope.gridApi = gridApi;
                gridApi.selection.on.rowSelectionChanged(this.$scope, (row) => {
                    this.goToSidepanel(row.entity.id);
                });
                if (!_.isUndefined(this.$stateParams.clusterId) && this.$stateParams.clusterId !== null) {
                    this.goToSidepanel(this.$stateParams.clusterId);
                }
            },
        };

        this.ClusterService.subscribe('data', this.updateClusters, {
            scope: this.$scope
        });
    }

    private updateClusters = () => {
        this.ServiceStateChecker.checkState(this.connectorType, this.serviceId);
        this.FusionClusterService.setClusterAllowListInfoForExpressway(this.ClusterService.getClustersByConnectorType(this.connectorType))
            .then((clusters) => {
                this.clusterList = clusters;
            })
            .catch(() => {
                this.clusterList = this.ClusterService.getClustersByConnectorType(this.connectorType);
            })

    };

    private goToSidepanel = (clusterId: string) => {
        this.$state.go('cluster-details', {
            clusterId: clusterId,
            connectorType: this.connectorType,
        });
    }

}

class HybridServiceClusterListComponent implements ng.IComponentOptions {
    public controller = HybridServiceClusterListCtrl;
    public templateUrl = 'modules/hercules/service-specific-pages/components/cluster-list/hybrid-service-cluster-list.html';
    public bindings = {
        serviceId: '<',
    };
}

export default angular
    .module('Hercules')
    .component('hybridServiceClusterList', new HybridServiceClusterListComponent())
    .name;
