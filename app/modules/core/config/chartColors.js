(function () {
  'use strict';

  var chartColors = {
    blue: '#3ca8e8',
    red: '#F46315',
    yellow: '#EBC31C',
    green: '#50D71D',
    brandSuccessDark: '#6ab140',
    brandSuccess: "#7cc153",
    brandSuccessLight: '#99cf78',
    brandWhite: '#fff',
    grayDarkOne: '#6a6b6c',
    grayDarkest: '#444',
    grayDarker: '#666',
    grayDark: '#999',
    gray: '#aaa',
    grayLightOne: '#AEAEAF',
    grayLightTwo: '#D7D7D8',
    grayLightThree: '#EBEBEC',
    grayLight: '#ccc',
    grayLighter: '#ddd',
    brandInfo: '#00c1aa',
    brandDanger: '#f05d3b',
    brandWarning: '#f7c100',
    dummyGray: '#ECECEC',
    primaryColorLight: '#66C5E8',
    primaryColorBase: '#049FD9',
    primaryColorDarker: '#0387B8',
    dummyGrayLight: '#F3F3F3',
    dummyGrayLighter: '#FAFAFA',
    dummyGrayFillLight: '#F5F5F6',
    dummyGrayFillLighter: '#EBEBEC',
    dummyGrayFillDark: '#D7D7D8',
    dummyGrayFillDarker: '#AEAEAF',
    colorAttentionBase: '#F5A623',
    colorPeopleLighter: '#C9EBE6',
    colorPeopleLight: '#6ec9bc',
    colorPeopleBase: '#14A792',
    brandRoyalBlue: '#5390E0',
    brandSkyBlue: '#3FAAB5',
    colorGreen: '#5AAE76',
    colorRed: '#F4735E',
    colorYellow: '#E99849',
    colorPurple: '#8E5ACF',
    colorLightGreen: '#43A942',
    colorLightGreenFill: '#017900',
    colorLightYellow: '#F5A623',
    colorLightYellowFill: '#FFA200',
    colorLightRed: '#F96452',
    colorLightRedFill: '#FF0000',
    metricLightGreen: '#7BAF5D',
    metricDarkGreen: '#417505',
    metricBlue: '#049FD9',
    metricYellow: '#F5A623',
    metricsRed: '#D03D35'
  };

  angular
    .module('Core')
    .value('chartColors', chartColors);

}());
