// Declare app level module which depends on other modules
angular.module('demoApp', [
  'as.sortable'
])
.controller('DemoController', ['$scope', 'SortableEventBus', function ($scope, SortableEventBus) {

  $scope.rows = [
    {
      name: "row1", 
      items: [
        {name: "row1-item1"},
        {name: "row1-item2"},
        {name: "row1-item3"},
        {name: "row1-item4"},
        {name: "row1-item5"},
        {name: "row1-item6"},
        {name: "row1-item7"},
        {name: "row1-item8"},
        {name: "row1-item9"},
        {name: "row1-item10"}
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
    },
    {
      name: "row5-empty",
      items: []
    }
  ];

  var eventBus = new SortableEventBus(["deselectAll", "deselect", "getSelected"]);

  $scope.sortableOptions = {
    dragStart: function(){
      //console.log("dragStart");
    },
    dragMove: function(){
      //console.log("dragMove");
    },
    dragEnd: function(){
      //console.log("dragEnd");
    },
    dragCancel: function(){
      //console.log("dragCancel");
    },
    selectionChanged: function(){
      console.log("selection changed");
    },
    itemMoved: function(eventArgs){
      console.log("item moved");
      console.log(eventArgs);
    },
    orderChanged: function(eventArgs){
      console.log("order changed");
      console.log(eventArgs);
    },
    eventBus: eventBus
  };

  // Deleting selected
  window.addEventListener("keydown", function(e){
    if(e.keyCode === 46) {
      console.log("delete fired");
      eventBus.fire("deselectAll", []);
    }
  });


}]);

