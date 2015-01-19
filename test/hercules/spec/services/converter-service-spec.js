'use strict';

describe('ConverterService', function () {

  // load the service's module
  beforeEach(module('wx2AdminWebClientApp'));

  // instantiate service
  var Service;
  beforeEach(inject(function (_ConverterService_) {
    Service = _ConverterService_;
  }));

  // connector conversion

  it('should inject connector status if it does not exist', function () {
    var mockData = [{}];
    var converted = Service.convertConnectors(mockData);
    expect(converted[0].status.state).toBe('unknown');
  });

  it('should inject status if alerts exist', function () {
    var mockData = [{
      status: {
        state: 'running',
        alarms: [{}]
      }
    }];
    var converted = Service.convertConnectors(mockData);
    expect(converted[0].status.state).toBe('error');
  });

  it('should inject classes based on state', function () {
    var converted = null;
    converted = Service.convertConnectors([{ status: { state: 'running' } }]);
    expect(converted[0].status_class).toBe('success');

    converted = Service.convertConnectors([{ status: { state: 'disabled' } }]);
    expect(converted[0].status_class).toBe('default');

    converted = Service.convertConnectors([{ status: { state: 'not_configured' } }]);
    expect(converted[0].status_class).toBe('default');

    converted = Service.convertConnectors([{ status: { state: 'foo' } }]);
    expect(converted[0].status_class).toBe('danger');

    converted = Service.convertConnectors([{ status: { state:  'running', alarms: [{}] } }]);
    expect(converted[0].status_class).toBe('danger');
  });

  // cluster conversion

  it('should aggregate cluster status from hosts in cluster where connectors are running or disabled', function () {
    var mockData = [{
      "services": [{
        "connectors": [
          {"state": "running"},
          {"state": "disabled"}
        ]
      }]
    }];
    var converted = Service.convertClusters(mockData);
    expect(converted[0].needs_attention).toBeFalsy();
    expect(converted[0].initially_open).toBeFalsy();
  });

  it('should aggregate cluster status from hosts in cluster where one connector is not running', function () {
    var mockData = [{
      "services": [{
        "connectors": [
          {"state": "running"},
          {"state": "installing"}
        ]
      }]
    }];
    var converted = Service.convertClusters(mockData);
    expect(converted[0].needs_attention).toBe(true);
    expect(converted[0].initially_open).toBe(true);
  });

  it('should aggregate cluster status from hosts in cluster where one connector has alarms', function () {
    var mockData = [{
      "services": [{
        "connectors": [
          {"state": "running", alarms: [{}]},
          {"state": "running"}
        ]
      }]
    }];
    var converted = Service.convertClusters(mockData);
    expect(converted[0].needs_attention).toBe(true);
    expect(converted[0].initially_open).toBe(true);
  });

  it('should aggregate service status from hosts in cluster where one connector has alarms', function () {
    var mockData = [{
      "services": [{
        "connectors": [
          {"state": "running", alarms: [{}]},
          {"state": "running"}
        ]
      }]
    }];
    var converted = Service.convertClusters(mockData);
    expect(converted[0].services[0].needs_attention).toBe(true);
  });

  it('should aggregate state from disabled services', function () {
    var mockData = [{
      "services": [{
        "connectors": [
          {"state": "disabled"}
        ]
      }]
    }];
    var converted = Service.convertClusters(mockData);
    expect(converted[0].services[0].is_disabled).toBe(true);
    expect(!!converted[0].services[0].needs_attention).toBe(false);
  });

  it('should aggregate number of hosts running the service', function () {
    var mockData = [{
      "services": [{
        "connectors": [
          {"state": "disabled"},
          {"state": "running"},
          {"state": "running"},
          {"state": "disabled"},
          {"state": "disabled"}
        ]
      }]
    }];
    var converted = Service.convertClusters(mockData);
    expect(converted[0].services[0].running_hosts).toBe(2);
    expect(!!converted[0].services[0].is_disabled).toBe(false);
    expect(!!converted[0].services[0].needs_attention).toBe(false);
  });


  it('should show sw update details per service', function() {
    var mockData = [{
      "provisioning_data": {
        "not_approved_packages": [
          {
            "service": {
              "service_type": "c_cal",
              "display_name": "Calendar Service"
            },
            "tlp_url": "gopher://whatever/c_cal_8.2-2.1.tlp",
            "version": "8.2-2.1"
          }
        ]
      },
      "services": [
        {
          "service_type": "c_cal",
          "display_name": "Calendar Service",
        }
      ]
    }];

    var converted = Service.convertClusters(mockData);
    expect(converted[0].services[0].not_approved_package).not.toBe(null);
    expect(converted[0].services[0].not_approved_package.service.service_type).toBe('c_cal');
  });

  it('should not show sw update details if service is disabled', function() {
    var mockData = [{
      "provisioning_data": {
        "not_approved_packages": [
          {
            "service": {
              "service_type": "c_cal",
              "display_name": "Calendar Service"
            },
            "tlp_url": "gopher://whatever/c_cal_8.2-2.1.tlp",
            "version": "8.2-2.1"
          }
        ]
      },
      "services": [
        {
          "service_type": "c_cal",
          "display_name": "Calendar Service",
          "connectors": [
            { "state": "disabled", version: 'bar_version', host: {host_name: 'bar_host_name'} }
          ]
        }
      ]
    }];

    var converted = Service.convertClusters(mockData);
    expect(converted[0].services[0].not_approved_package).toBeFalsy();
  });

  it('a cluster with all hosts disabled isnt running', function() {
    var mockData = [{
      "services": [
        {
          "service_type": "c_cal",
          "display_name": "Calendar Service",
          "connectors": [
            { "state": "disabled", version: 'bar_version', host: {host_name: 'bar_host_name'} },
            { "state": "disabled", version: 'bar_version', host: {host_name: 'bar_host_name'} }
          ]
        }
      ]
    }];
    var converted = Service.convertClusters(mockData);
    expect(converted.running_hosts).toBeFalsy();
  });

  it('should raise alarm for running services that do not run the correct SW version', function() {
    var mockData = [{
      "provisioning_data": {
        "approved_packages": [{
          "service": { "service_type": "c_cal" },
          "version": "8.2-2.1"
        }]
      },
      "services": [{
        "service_type": "c_cal",
        "connectors": [
          { "state": "running", version: 'foo_version', host: {host_name: 'foo_host_name'} },
          { "state": "disabled", version: 'bar_version', host: {host_name: 'bar_host_name'} }
        ]
      }]
    }];

    var converted = Service.convertClusters(mockData);
    expect(converted[0].needs_attention).toBe(true);
    expect(converted[0].services[0].needs_attention).toBe(true);
    expect(converted[0].services[0].connectors[0].deduced_alarms.length).toEqual(1);
    expect(converted[0].services[0].connectors[0].deduced_alarms[0].type).toEqual('software_version_mismatch');
    expect(converted[0].services[0].connectors[0].deduced_alarms[0].expected_version).toEqual('8.2-2.1');
    expect(converted[0].services[0].connectors[1].deduced_alarms.length).toEqual(0);
  });

  it('should not fail if approved_packages is empty', function() {
    var mockData = [{
      "provisioning_data": {
        "approved_packages": [{ "service": { "service_type": "yolo" }, "version": "8.2-2.1" }]
      },
      "services": [{
        "service_type": "c_cal",
        "connectors": [
          { "state": "running", version: 'foo_version', host: {host_name: 'foo_host_name'} },
          { "state": "running", version: 'bar_version', host: {host_name: 'bar_host_name'} }
        ]
      }]
    }];

    var converted = Service.convertClusters(mockData);
    expect(converted[0].needs_attention).toBeFalsy();
    expect(converted[0].services[0].needs_attention).toBeFalsy();
    expect(converted[0].services[0].connectors[0].deduced_alarms.length).toEqual(0);
    expect(converted[0].services[0].connectors[1].deduced_alarms.length).toEqual(0);
  });

  it('should sort clusters based on error status', function () {
    var mockData = [
      { id: 'uno_disabled', "services": [{ "connectors": [ {"state": "disabled"} ] }] },
      { id: 'dos_error',    "services": [{ "connectors": [ {"state": "running", alarms: [{}]}, {"state": "running"} ] }] },
      { id: 'tres_ok',      "services": [{ "connectors": [ {"state": "running"} ] }] }
    ];
    var converted = Service.convertClusters(mockData);
    expect(converted[0].id).toBe('dos_error');
  });

  it('should services based on error status', function () {
    var mockData = [{"services": [
      { id: "dsbld", "connectors": [ {"state": "disabled"} ] },
      { id: "rnnng", "connectors": [ {"state": "running"} ] },
      { id: "errrr", "connectors": [ {"state": "error"} ] }
    ]}];
    var converted = Service.convertClusters(mockData);
    expect(converted[0].services[0].id).toBe('errrr');
    expect(converted[0].services[1].id).toBe('rnnng');
    expect(converted[0].services[2].id).toBe('dsbld');
  });

});
