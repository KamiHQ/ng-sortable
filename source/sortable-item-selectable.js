/*jshint indent: 2 */
/*global angular: false */

(function () {

  'use strict';
  var mainModule = angular.module('as.sortable');

  mainModule.directive('asSortableItemSelectable', ['$timeout', '$helper',
  function ($timeout, $helper) {

    return {
      require: '^asSortableItem',
      scope: true,
      restrict: 'A',
      controller: 'as.sortable.sortableItemHandleController',
      link: function (scope, element, attrs, itemController) {
        scope.itemScope = itemController.scope;
        var startPosition = {};
        var threshold = 10; // TODO: move this into config
        var groupScope = null;
        $timeout(function(){
          groupScope = scope.itemScope.sortableScope.groupScope;
        } ,0);

        var handlePointerDown = function (e) {
          startPosition.initiated = true;
          startPosition.clientX = e.clientX;
          startPosition.clientY = e.clientY;
          if (e.ctrlKey || e.metaKey) {
            return;
          } else {
            if (!$helper.isSelected(groupScope.selected, scope.itemScope)) {
              scope.$apply(function(){
                groupScope.removeAllFromSelected();
                groupScope.addToSelected(scope.itemScope);
              });
            }
          }
        };

        var handlePointerUp = function (e) {
          if (!startPosition.initiated) {
            return;
          }
          if (e.clientX <= (startPosition.clientX + threshold) &&
            e.clientX >= (startPosition.clientX - threshold) &&
            e.clientY <= (startPosition.clientY + threshold) &&
            e.clientY >= (startPosition.clientY - threshold)
          ) {
            // Is a click
            scope.$apply(function(){
              groupScope.addToSelected(scope.itemScope);
            });
          }
          startPosition.initiated = false;
        };

        if (window.PointerEvent) {
          element.on('pointerdown', handlePointerDown);
          element.on('pointerup', handlePointerUp);
        } else {
          element.on('mousedown', handlePointerDown);
          element.on('mouseup', handlePointerUp);
          element.on('touchstart', handlePointerDown);
          element.on('touchend', handlePointerUp);
        }

      }
    };

  }
  ]);

})();