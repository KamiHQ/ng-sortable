/*jshint indent: 2 */
/*global angular: false */

(function () {

  'use strict';
  var mainModule = angular.module('as.sortable');

  /**
   * Controller for sortable item.
   *
   * @param $scope - drag item scope
   */
  mainModule.controller('as.sortable.sortableItemController', ['$scope', 'sortableConfig', '$helper', '$document', '$timeout', function ($scope, sortableConfig, $helper, $document, $timeout) {

    this.scope = $scope;

    $scope.sortableScope = null;
    $scope.modelValue = null; // sortable item.
    $scope.type = 'item';

    /**
     * returns the index of the drag item from the sortable list.
     *
     * @returns {*} - index value.
     */
    $scope.index = function () {
      return $scope.$index;
    };

    /**
     * returns the index of the drag item over the sortable group.
     *
     * @returns {row: row number, column: index in the current row}
     */
    $scope.overAllIndex = function() {
      return {
        row: $scope.sortableScope.rowIndex,
        column: $scope.$index
      };
    };

    /**
     * Returns the item model data.
     *
     * @returns {*} - item model value.
     */
    $scope.itemData = function () {
      return $scope.sortableScope.modelValue[$scope.$index];
    };

    /**
     * Methods for selection
     *
     */
    $scope.select = function(){
      $scope.element.addClass(sortableConfig.selectedClass);
    };

    $scope.unselected = function(){
      $scope.element.removeClass(sortableConfig.selectedClass);
    };

    // Recreate when reloads
    $timeout(function(){
      if($helper.isSelected($scope.sortableScope.groupScope.selected, $scope, $scope.modelValue.$$hashKey)) {
        $scope.select();
      }
    }, 0);
    /**
     * Methods for drag and drop
     *
     */
    var placeHolder = null;
    var placeElement = null;

    $scope.createDragElement = function(clone){
      if(clone) {
        return $scope.element.clone();
      } else {
        return $scope.element;
      }
    };

    $scope.createPlaceholder = function(append){
      if (typeof $scope.sortableScope.options.placeholder === 'function') {
        placeHolder = angular.element($scope.sortableScope.options.placeholder($scope));
      } else if (typeof $scope.sortableScope.options.placeholder === 'string') {
        placeHolder = angular.element($scope.sortableScope.options.placeholder);
      } else {
        placeHolder = angular.element($document[0].createElement($scope.element.prop('tagName')));
      }
      placeHolder.addClass(sortableConfig.placeHolderClass).addClass($scope.sortableScope.options.additionalPlaceholderClass);
      placeHolder.css('width', $helper.width($scope.element) + 'px');
      placeHolder.css('height', $helper.height($scope.element) + 'px');
      if(append && !$scope.sortableScope.options.clone){
        $scope.element.after(placeHolder);
      }
      return placeHolder;
    };

    $scope.createPlaceElement = function(append){
      var tagName = $scope.element.prop('tagName');
      placeElement = angular.element($document[0].createElement(tagName));
      if (sortableConfig.hiddenClass) {
        placeElement.addClass(sortableConfig.hiddenClass);
      }
      if(append) {
        $scope.element.after(placeElement);
      }
      return placeElement;
    };

    /**
     * Inserts the placeHolder in to the targetScope.
     *
     * @param targetElement the target element
     * @param targetScope the target scope
     */
    $scope.insertBefore = function(targetElement, targetScope, dragItemsInfo) {
      // Ensure the placeholder is visible in the target (unless it's a table row)
      if (placeHolder.css('display') !== 'table-row') {
        placeHolder.css('display', 'block');
      }
      if (!targetScope.sortableScope.options.clone) {
        targetElement[0].parentNode.insertBefore(placeHolder[0], targetElement[0]);
        dragItemsInfo.moveTo(targetScope.sortableScope, targetScope.index());
      }
    };

    /**
     * Inserts the placeHolder next to the targetScope.
     *
     * @param targetElement the target element
     * @param targetScope the target scope
     */
    $scope.insertAfter = function(targetElement, targetScope, dragItemsInfo) {
      // Ensure the placeholder is visible in the target (unless it's a table row)
      if (placeHolder.css('display') !== 'table-row') {
        placeHolder.css('display', 'block');
      }
      if (!targetScope.sortableScope.options.clone) {
        targetElement.after(placeHolder);
        dragItemsInfo.moveTo(targetScope.sortableScope, targetScope.index() + 1);
      }
    };

    $scope.appendPlaceHolder = function(targetElement){
      targetElement[0].appendChild(placeHolder[0]);
    };

    $scope.rollbackDragChanges = function(){
      if (!$scope.sortableScope.cloning) {
        placeElement.replaceWith($scope.element);
      }
      placeHolder.remove();
    };

  }]);

  /**
   * sortableItem directive.
   */
  mainModule.directive('asSortableItem', ['sortableConfig',
    function (sortableConfig) {
      return {
        require: ['^asSortable', '?ngModel'],
        restrict: 'A',
        controller: 'as.sortable.sortableItemController',
        link: function (scope, element, attrs, ctrl) {
          var sortableController = ctrl[0];
          var ngModelController = ctrl[1];
          if (sortableConfig.itemClass) {
            element.addClass(sortableConfig.itemClass);
          }
          scope.sortableScope = sortableController.scope;

          if (ngModelController) {
            ngModelController.$render = function () {
              scope.modelValue = ngModelController.$modelValue;
            };
          } else {
            scope.modelValue = sortableController.scope.modelValue[scope.$index];
          }
          scope.element = element;
          element.data('_scope',scope); // #144, work with angular debugInfoEnabled(false)
        }
      };
    }]);

}());
