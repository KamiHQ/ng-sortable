/*jshint undef: false, unused: false, indent: 2*/
/*global angular: false */

(function () {

  'use strict';
  var mainModule = angular.module('as.sortable');

  /**
   * Controller for Sortable.
   * @param $scope - the sortable scope.
   */
  mainModule.controller('as.sortable.sortableController', ['$scope', function ($scope) {

    this.scope = $scope;

    $scope.modelValue = null; // sortable list.
    $scope.callbacks = null;
    $scope.type = 'sortable';
    $scope.options = {
      longTouch: false
    };
    $scope.isDisabled = false;

    /**
     * Inserts the item in to the sortable list.
     *
     * @param index - the item index.
     * @param itemData - the item model data.
     */
    $scope.insertItem = function (index, itemData) {
      if ($scope.options.allowDuplicates) {
        $scope.modelValue.splice(index, 0, angular.copy(itemData));
      } else {
        $scope.modelValue.splice(index, 0, itemData);
      }
    };

    /**
     * Removes the item from the sortable list.
     *
     * @param item - item to be removed.
     * @returns {*} - removed item.
     */
    $scope.removeItem = function (item) {
      var removedItem = null;
      var index = -1;

      if(item.$$hashKey) {
        for(var i = 0; i < $scope.modelValue.length; i++) {
          if($scope.modelValue[i].$$hashKey === item.$$hashKey) {
            index = i;
            break;
          }
        }
      } else {
        index = $scope.modelValue.indexOf(item);
      }

      if (index > -1) {
        removedItem = $scope.modelValue.splice(index, 1)[0];
      }
      return removedItem;
    };

    var scrollState = {
      interval: null,
      scroll: function(x, y) { // x, y is the distance travelled in some time frame
        var newScrollPosition = {
          left: $scope.scrollContainer.scrollLeft + x,
          top: $scope.scrollContainer.scrollTop + y
        };
        $scope.scrollContainer.scroll(newScrollPosition);
      },
      setScrollSpeed: function(scrollVector) { // x, y is a velocity vector representing the scroll speed
        var x = scrollVector[0];
        var y = scrollVector[1];
        if(this.interval) {
          this.cancel();
        }
        if((x === 0) && (y === 0)) {
          return;
        }
        var self = this;
        this.interval = setInterval(function(){
          self.scroll(x, y);
        }, 10);
        self.scroll(x, y);
      },
      cancel: function() {
        clearInterval(this.interval);
        this.interval = null;
      }
    };

    /**
    * Watch the scroll Container for auto-scrolling
    */
    $scope.checkScrollContainer = function(event) {
      if(!$scope.scrollContainer) {
        return;
      }
      var scrollContainerRect = $scope.scrollContainer.getBoundingClientRect();
      var ghostDiv = $scope.groupScope.dragState.dragElementsContainer[0];
      if(!ghostDiv) {
        return;
      }
      var ghostRect = ghostDiv.getBoundingClientRect();
      var threshold = 5;
      var scrollSpeed = $scope.scrollSpeed || 5;


      var scrollVector = [0, 0];
      if(ghostRect.right >= (scrollContainerRect.right - threshold)) { // Does the ghost overlap the right bound
        scrollVector[0] += scrollSpeed;
      } else if(ghostRect.left <= (scrollContainerRect.left + threshold)) { // Does the ghost overlap the left bound
        scrollVector[0] -= scrollSpeed;
      }

      if(ghostRect.bottom >= (scrollContainerRect.bottom - threshold)) { // Does the ghost overlap the bottom bound
        scrollVector[1] += scrollSpeed;
      } else if(ghostRect.top <= (scrollContainerRect.top + threshold)) { // Does the ghost overlap the top bound
        scrollVector[1] -= scrollSpeed;
      }

      scrollState.setScrollSpeed(scrollVector);
    };

    $scope.terminateScroll = function(event) {
      scrollState.cancel();
    };

  }]);

  /**
   * Sortable directive
   * Parent directive for draggable and sortable items.
   * Sets modelValue, element in scope.
   * sortOptions also includes a longTouch option which activates longTouch when set to true (default is false).
   */
  mainModule.directive('asSortable',
    function () {
      return {
        require: ['?ngModel', '^asSortableGroup'], // get a hold of NgModelController
        restrict: 'A',
        scope: true,
        controller: 'as.sortable.sortableController',
        link: function (scope, element, attrs, ctrl) {

          var ngModel;

          ngModel = ctrl[0];
          scope.groupScope = ctrl[1].scope;
          if (!ngModel) {
            return; // do nothing if no ng-model
          }

          // Set the model value in to scope.
          ngModel.$render = function () {
            scope.modelValue = ngModel.$modelValue;
          };
          //set the element in scope to be accessed by its sub scope.
          scope.element = element;
          element.data('_scope',scope); // #144, work with angular debugInfoEnabled(false)

          //Set the sortOptions else set it to default.
          scope.$watch(attrs.asSortable, function (newVal, oldVal) {
            angular.forEach(newVal, function (value, key) {
              scope.options[key] = value;
            });
          }, true);

          // Set isDisabled if attr is set, if undefined isDisabled = false
          if (angular.isDefined(attrs.isDisabled)) {
            scope.$watch(attrs.isDisabled, function (newVal, oldVal) {
              if (!angular.isUndefined(newVal)) {
                scope.isDisabled = newVal;
              }
            }, true);
          }

          // Set row order
          scope.$watch(attrs.asRowNumber, function (newVal, oldVal) {
            scope.rowIndex = newVal;
          });

          // Set scroll container
          scope.$watch(attrs.asScrollContainer, function(newVal, oldVal) {
            scope.scrollContainer = newVal;
          });

          // Set scroll speed
          scope.$watch(attrs.asScrollSpeed, function(newVal, oldVal) {
            scope.scrollSpeed = parseInt(newVal);
          });
        }
      };
    });

}());
