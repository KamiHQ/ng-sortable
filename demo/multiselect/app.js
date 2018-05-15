// Declare app level module which depends on other modules
angular.module('demoApp', [
  'as.sortable'
])
.controller('DemoController', ['$scope', function ($scope) {

  $scope.rows = [
    {
      name: "row1", 
      items: [
        {name: "row1-item1"},
        {name: "row1-item2"},
        {name: "row1-item3"},
        {name: "row1-item4"}
      ]
    },
    {
      name: "row2", 
      items: [
        {name: "row2-item1"},
        {name: "row2-item2"},
        {name: "row2-item3"},
        {name: "row2-item4"}
      ]
    },
    {
      name: "row3", 
      items: [
        {name: "row3-item1"},
        {name: "row3-item2"},
        {name: "row3-item3"},
        {name: "row3-item4"}
      ]
    },
    {
      name: "row4", 
      items: [
        {name: "row4-item1"},
        {name: "row4-item2"},
        {name: "row4-item3"},
        {name: "row4-item4"}
      ]
    }
  ];

  $scope.sortableOptions = {};
}]);

