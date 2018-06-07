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
            if (e.ctrlKey || e.metaKey || e.shiftKey || scope.dragging) {
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

          var initiatedEventBus = false;
          function initiateEventBus(eventBus){
            eventBus.on('deselectAll', function(){
              scope.removeAllFromSelected();
            });

            eventBus.on('deselect', function(index){
              return;
            });

            eventBus.on('getSelected', function(){
              return scope.selected;
            });

            eventBus.on('getIsDragging', function(){
              return scope.dragging;
            });
          }

          scope.$watch(attrs.asSortableGroup, function (newVal, oldVal) {
            angular.forEach(newVal, function (value, key) {
              if(key === 'eventBus') {
                if(value !== null && !initiatedEventBus) {
                  initiateEventBus(value);
                  initiatedEventBus = true;
                }
              } else if (callbacks[key]) {
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
      if ( $helper.isSelected($scope.selected, itemScope) ) {
        $scope.removeFromSelected(itemScope);
      } else {
        $scope.addToSelected(itemScope);
      }
    };

    $scope.addToSelected = function(itemScope) {
      var idx = $scope.selected.indexOf(itemScope);
      if (idx === -1) {
        $scope.selected.push(itemScope);
        $helper.orderSelected($scope.selected);
      }
      itemScope.select();
      $helper.debounceCall('selectionChanged', $scope.callbacks.selectionChanged, [$scope.selected], 1000); // Wait 1 second for user selection to finish
    };

    $scope.removeFromSelected = function(itemScope) {
      var idx = $scope.selected.indexOf(itemScope);
      if (idx > -1) {
        $scope.selected.splice(idx, 1);
      }
      itemScope.unselected();
      $helper.debounceCall('selectionChanged', $scope.callbacks.selectionChanged, [$scope.selected], 1000);
    };

    $scope.removeAllFromSelected = function(){
      while ($scope.selected.length > 0) {
        $scope.removeFromSelected($scope.selected[0]);
      }
    };

    $scope.expandToSelected = function(itemScope){
      if($scope.selected.length === 0) {
        $scope.addToSelected(itemScope);
      } else if ($helper.isSelected($scope.selected, itemScope)) {
        // Already selected do nothing
        return;
      } else if($helper.allSameParents($scope.selected.concat(itemScope))) {
        // Same parents expand to selected
        var sortableElement = itemScope.sortableScope.element[0];
        var maxMinIndexes = $helper.findMaxMinIndex($scope.selected.concat(itemScope));
        var scopes = $helper.getBetweenScopes(sortableElement, '.' + sortableConfig.itemClass, maxMinIndexes.min, maxMinIndexes.max);
        for (var i = 0; i < scopes.length; i++) {
          $scope.addToSelected(scopes[i]);
        }
      }
    };

    $scope.selected = [];

    // Functions associated with moving multiple selected items
    var dragState = {
      containment: null,
      dragElementsContainer: null,
      dragItemsInfo: null,
      itemPosition: null
    };
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
    }

    /**
     * Check there is no place holder placed by itemScope.
     * @param targetElement the target element to check with.
     * @returns {*} true if place holder present.
     */
    function isPlaceHolderPresent (targetElement) {
      return placeHolderIndex(targetElement) >= 0;
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
    var scrollableContainer = $document[0].documentElement;

    $scope.dragStart = function(event){
      var eventObj = $helper.eventObj(event);
      if($scope.dragging){
        return;
      } else {
        $scope.dragging = true;
      }
      dragState.dragElementsContainer = angular.element('<div>').addClass(sortableConfig.dragClass);
      dragState.containment = angular.element($document[0].body);
      dragState.dragItemsInfo = $helper.dragItems($scope.selected);

      var itemElement = $helper.findAncestor(event.target, '.' + sortableConfig.itemClass);
      dragState.itemPosition = $helper.positionStarted(eventObj, itemElement, scrollableContainer);

      for(var i = 0; i < $scope.selected.length; i++) {
        var selected = $scope.selected[i];
        var cloning = $helper.isCloning(selected, event.ctrlKey);
        var dragElement = selected.createDragElement(cloning);
        var placeHolder = selected.createPlaceholder(true);
        var placeElement = selected.createPlaceElement(!cloning);
        dragState.dragElementsContainer.append(dragElement);
      }
      dragState.containment.append(dragState.dragElementsContainer);

      $helper.movePosition(eventObj, dragState.dragElementsContainer, dragState.itemPosition, dragState.containment, 'absolute', scrollableContainer);
      $scope.$apply(function(){
        $scope.callbacks.dragStart(eventObj);
      });
    };


    $scope.dragMove = function(event){
      var eventObj = $helper.eventObj(event);
      var targetX = event.pageX - $document[0].documentElement.scrollLeft;
      var targetY = event.pageY - ($window.pageYOffset || $document[0].documentElement.scrollTop);
      var targetElement = angular.element($document[0].elementFromPoint(targetX, targetY));
      var targetScope = $helper.fetchScope(targetElement, sortableConfig.handleClass);
      var i, selected;
      if (!targetScope || !targetScope.type) {
        return;
      }

      $helper.movePosition(eventObj, dragState.dragElementsContainer, dragState.itemPosition, dragState.containment, 'absolute', scrollableContainer);

      if(targetScope.type === 'item') {
        // decide where to insert placeholder based on target element and current placeholder if is present
        targetElement = targetScope.element;
        var placeholderIndex = placeHolderIndex(targetScope.sortableScope.element);
        for(i = 0; i < $scope.selected.length; i++) {
          selected = $scope.selected[i];
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
        if (!$helper.isParent(targetScope.element[0], targetElement[0])) {
          //moving over sortable bucket. not over item.
          if (!isPlaceHolderPresent(targetElement) && !targetScope.options.clone) {
            for(i = 0; i < $scope.selected.length; i++) {
              selected = $scope.selected[i];
              selected.appendPlaceHolder(targetElement);
              dragState.dragItemsInfo.moveTo(targetScope, targetScope.modelValue.length);
            }
          }
        }
      }
      $scope.$apply(function(){
        $scope.callbacks.dragMove(eventObj);
      });
    };

    $scope.dragEnd = function(event, cancel){
      var eventObj = $helper.eventObj(event);
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

      $scope.$apply(function(){
        if(cancel) {
          $scope.callbacks.dragCancel(eventObj);
        } else {
          var runCallback = function(){};
          var eventArgs = dragState.dragItemsInfo.eventArgs();
          if(dragState.dragItemsInfo.allSameParent()){
            if(dragState.dragItemsInfo.isOrderChanged()){
              runCallback = function(){
                $scope.callbacks.orderChanged(eventArgs);
              };
            }
          } else {
            runCallback = function(){
              $scope.callbacks.itemMoved(eventArgs);
            };
          }

          dragState.dragItemsInfo.apply();
          runCallback();
          $scope.callbacks.dragEnd(eventObj);
        }
        dragState.dragItemsInfo = null;
        dragState.itemPosition = null;
      });
    };
    
  }]);

})();