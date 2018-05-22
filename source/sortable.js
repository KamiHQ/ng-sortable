/*jshint undef: false, unused: false, indent: 2*/
/*global angular: false */

(function () {

  'use strict';
  var mainModule = angular.module('as.sortable');

  /**
   * Directive as sortable group
   * Defines selected items
   */
  mainModule.directive('asSortableGroup',
    function () {
      return {
        restrict: 'A',
        controller: 'as.sortable.sortableGroupController',
        scope: true,
        link: function(scope, element, attrs) {
          scope.options = {};
          var callbacks;

          var pointerUpCallback = function(e) {
            if (e.ctrlKey || e.metaKey || scope.dragging) {
              return;
            } else {
              scope.$apply(function(){
                scope.removeAllFromSelected();
              });
            }
          };

          if (window.PointerEvent) {
            window.addEventListener('pointerup', pointerUpCallback, true);
          } else {
            window.addEventListener('touchend', pointerUpCallback, true);
          }

          scope.$on('$destroy', function(){
            window.removeEventListener('pointerup', pointerUpCallback);
            window.removeEventListener('touchend', pointerUpCallback);
          });

          callbacks = {orderChanged: null, itemMoved: null, dragStart: null, dragMove:null, dragCancel: null, dragEnd: null, selectionChanged: null};

          /**
           * Invoked when order of a drag item is changed.
           *
           * @param event - the event object.
           */
          callbacks.orderChanged = function (event) {
          };

          /**
           * Invoked when the item is moved to other sortable.
           *
           * @param event - the event object.
           */
          callbacks.itemMoved = function (event) {
          };

          /**
           * Invoked when the drag started successfully.
           *
           * @param event - the event object.
           */
          callbacks.dragStart = function (event) {
          };

          /**
           * Invoked when the drag move.
           *
           * @param itemPosition - the item position.
           * @param containment - the containment element.
           * @param eventObj - the event object.
          */
          callbacks.dragMove = angular.noop;

          /**
           * Invoked when the drag cancelled.
           *
           * @param event - the event object.
           */
          callbacks.dragCancel = function (event) {
          };

          /**
           * Invoked when the drag stopped.
           *
           * @param event - the event object.
           */
          callbacks.dragEnd = function (event) {
          };

          /**
           * Invoked when the selection changes.
           *
           * @param event - the event object.
           */
          callbacks.selectionChanged = function (event) {
          };

          scope.$watch(attrs.asSortableGroup, function (newVal, oldVal) {
            angular.forEach(newVal, function (value, key) {
              if (callbacks[key]) {
                if (typeof value === 'function') {
                  callbacks[key] = value;
                }
              } else {
                scope.options[key] = value;
              }
            });
            scope.callbacks = callbacks;
          }, true);

        }
      };
    }
  );

  mainModule.controller('as.sortable.sortableGroupController', ['$scope', 'sortableConfig', '$document', '$window', '$helper', function ($scope, sortableConfig, $document, $window, $helper) {

    this.scope = $scope;

    $scope.toggleAddSelected = function(itemScope) {
      if ( $scope.isSelected(itemScope) ) {
        $scope.removeFromSelected(itemScope);
      } else {
        $scope.addToSelected(itemScope);
      }
    };

    $scope.addToSelected = function(itemScope) {
      var idx = $scope.selected.indexOf(itemScope);
      if (idx === -1) {
        $scope.selected.push(itemScope);
        $scope.orderSelected();
      }
      itemScope.select();
    };

    $scope.removeFromSelected = function(itemScope) {
      var idx = $scope.selected.indexOf(itemScope);
      if (idx > -1) {
        $scope.selected.splice(idx, 1);
      }
      itemScope.unselected();
    };

    $scope.removeAllFromSelected = function(){
      while ($scope.selected.length > 0) {
        $scope.removeFromSelected($scope.selected[0]);
      }
    };

    $scope.swapSelected = function(index, newSelected){
      $scope.selected[index] = newSelected;
      $scope.orderSelected();
    }

    $scope.isSelected = function(itemScope, hashKey){
      var index = $scope.selected.indexOf(itemScope);
      if(index === -1) {
        if (hashKey === undefined) {
          return false;
        } else {
          for(var i = 0; i < $scope.selected.length; i++){
            if($scope.selected[i].modelValue.$$hashKey === hashKey){
              index = i;
              // Swap out the itemScope to new one
              $scope.swapSelected(i, itemScope);
              break;
            }
          }
          return index !== -1;
        }
      } else {
        return true;
      }
    };

    $scope.orderSelected = function(){
      $scope.selected.sort(function(selectedA, selectedB){
        var a = selectedA.overAllIndex();
        var b = selectedB.overAllIndex();
        if(a.row > b.row){
          return 1;
        } else if(a.row < b.row){
          return -1;
        } else {
          return a.column >= b.column ? 1 : -1;
        }

      });
    };

    $scope.selected = [];

    // Functions associated with moving multiple selected items
    var dragState = {
      containment: null,
      dragElementsContainer: null,
      dragItemsInfo: null
    };

    function isCloning(selected, shift) {
      selected.sortableScope.cloning = selected.sortableScope.options.clone || (selected.sortableScope.options.ctrlClone && shift);
      return selected.sortableScope.cloning;
    }

    function positionDragElementsContainer(event){
      dragState.dragElementsContainer.css({position: 'absolute'});
      dragState.dragElementsContainer.css({top: event.clientY + 'px'});
      dragState.dragElementsContainer.css({left: event.clientX + 'px'});
    }

    /**
     * Fetch scope from element or parents
     * @param  {object} element Source element
     * @return {object}         Scope, or null if not found
     */
    function fetchScope(element) {
      var scope;
      while (!scope && element.length) {
        scope = element.data('_scope');
        if (!scope) {
          element = element.parent();
        }
      }
      return scope;
    }

    /**
     * Get position of place holder among item elements in itemScope.
     * @param targetElement the target element to check with.
     * @returns {*} -1 if placeholder is not present, index if yes.
     */
    function placeHolderIndex (targetElement) {
      var itemElements, i;
      // targetElement is placeHolder itself, return index 0
      if (targetElement.hasClass(sortableConfig.placeHolderClass)){
        return 0;
      }
      // find index in target children
      itemElements = targetElement.children();
      for (i = 0; i < itemElements.length; i += 1) {
        //TODO may not be accurate when elements contain other siblings than item elements
        //solve by adding 1 to model index of previous item element
        if (angular.element(itemElements[i]).hasClass(sortableConfig.placeHolderClass)) {
          return i;
        }
      }
      return -1;
    };

    /**
     * Check there is no place holder placed by itemScope.
     * @param targetElement the target element to check with.
     * @returns {*} true if place holder present.
     */
    function isPlaceHolderPresent (targetElement) {
      return placeHolderIndex(targetElement) >= 0;
    };

    //Check if a node is parent to another node
    function isParent(possibleParent, elem) {
      if(!elem || elem.nodeName === 'HTML') {
        return false;
      }

      if(elem.parentNode === possibleParent) {
        return true;
      }

      return isParent(possibleParent, elem.parentNode);
    }

    function addDragClasses() {
      dragState.containment.css('cursor', 'move');
      dragState.containment.css('cursor', '-webkit-grabbing');
      dragState.containment.css('cursor', '-moz-grabbing');
      dragState.containment.addClass('as-sortable-un-selectable');
    }

    function removeDragClasses() {
      dragState.containment.css('cursor', '');
      dragState.containment.removeClass('as-sortable-un-selectable');
    }

    $scope.dragging = false;

    $scope.dragStart = function(event){
      if($scope.dragging){
        return;
      } else {
        $scope.dragging = true;
      }
      dragState.dragElementsContainer = angular.element("<div>").addClass(sortableConfig.dragClass);
      dragState.containment = angular.element($document[0].body);
      dragState.dragItemsInfo = $helper.dragItems($scope.selected);
      for(var i = 0; i < $scope.selected.length; i++) {
        var selected = $scope.selected[i];
        var cloning = isCloning(selected, event.ctrlKey);
        var dragElement = selected.createDragElement(cloning);
        var placeHolder = selected.createPlaceholder(true);
        var placeElement = selected.createPlaceElement(!cloning);
        dragState.dragElementsContainer.append(dragElement);
      }
      dragState.containment.append(dragState.dragElementsContainer);
      positionDragElementsContainer(event);
    };


    $scope.dragMove = function(event){
      positionDragElementsContainer(event);
      var targetX = event.pageX - $document[0].documentElement.scrollLeft;
      var targetY = event.pageY - ($window.pageYOffset || $document[0].documentElement.scrollTop);
      var targetElement = angular.element($document[0].elementFromPoint(targetX, targetY));
      var targetScope = fetchScope(targetElement);
      if (!targetScope || !targetScope.type) {
        return;
      }

      if(targetScope.type === 'item') {
        // decide where to insert placeholder based on target element and current placeholder if is present
        targetElement = targetScope.element;
        var placeholderIndex = placeHolderIndex(targetScope.sortableScope.element);
        for(var i = 0; i < $scope.selected.length; i++) {
          var selected = $scope.selected[i];
          if (placeholderIndex < 0) {
            selected.insertBefore(targetElement, targetScope, dragState.dragItemsInfo);
          } else {
            if (placeholderIndex <= targetScope.index()) {
              selected.insertAfter(targetElement, targetScope, dragState.dragItemsInfo);
            } else {
              selected.insertBefore(targetElement, targetScope, dragState.dragItemsInfo);
            }
          }
        }
      } else if(targetScope.type === 'sortable') { // For moving over an empty row
        if (!isParent(targetScope.element[0], targetElement[0])) {
          //moving over sortable bucket. not over item.
          if (!isPlaceHolderPresent(targetElement) && !targetScope.options.clone) {
            for(var i = 0; i < $scope.selected.length; i++) {
              var selected = $scope.selected[i];
              selected.appendPlaceHolder(targetElement);
              dragState.dragItemsInfo.moveTo(targetScope, targetScope.modelValue.length);
            }
          }
        }
      }
    };

    $scope.dragEnd = function(event, cancel){
      if(!$scope.dragging){
        return;
      } else {
        $scope.dragging = false;
      }
      for(var i = 0; i < $scope.selected.length; i++){
        var selected = $scope.selected[i];
        selected.rollbackDragChanges();
      }
      dragState.dragElementsContainer.remove();
      dragState.dragElementsContainer = null;

      if(!cancel) {
        $scope.$apply(function(){
          dragState.dragItemsInfo.apply();
        });
      }
      dragState.dragItemsInfo = null;
    };
    
  }]);

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
      var index = $scope.modelValue.indexOf(item);
      if (index > -1) {
        removedItem = $scope.modelValue.splice(index, 1)[0];
      }
      return removedItem;
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
          scope.rowIndex;
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
        }
      };
    });

}());
