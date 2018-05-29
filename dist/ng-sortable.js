/*
 ng-sortable v1.3.8
 The MIT License (MIT)

 Copyright (c) 2014 Muhammed Ashik

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

/*jshint indent: 2 */
/*global angular: false */

(function () {
  'use strict';
  angular.module('as.sortable', [])
    .constant('sortableConfig', {
      itemClass: 'as-sortable-item',
      handleClass: 'as-sortable-item-handle',
      placeHolderClass: 'as-sortable-placeholder',
      dragClass: 'as-sortable-drag',
      hiddenClass: 'as-sortable-hidden',
      dragging: 'as-sortable-dragging',
      selectedClass: 'as-sortable-selected'
    });
}());

/*jshint indent: 2 */
/*global angular: false */

(function () {
  'use strict';

  var mainModule = angular.module('as.sortable');

  /**
   * Helper factory for sortable.
   */
  mainModule.factory('$helper', ['$document', '$window', '$timeout',
    function ($document, $window, $timeout) {
      return {

        /**
         * Get the height of an element.
         *
         * @param {Object} element Angular element.
         * @returns {String} Height
         */
        height: function (element) {
          return element[0].getBoundingClientRect().height;
        },

        /**
         * Get the width of an element.
         *
         * @param {Object} element Angular element.
         * @returns {String} Width
         */
        width: function (element) {
          return element[0].getBoundingClientRect().width;
        },

        /**
         * Get the offset values of an element.
         *
         * @param {Object} element Angular element.
         * @param {Object} [scrollableContainer] Scrollable container object for calculating relative top & left (optional, defaults to Document)
         * @returns {Object} Object with properties width, height, top and left
         */
        offset: function (element, scrollableContainer) {
          var boundingClientRect = element[0].getBoundingClientRect();
          if (!scrollableContainer) {
            scrollableContainer = $document[0].documentElement;
          }

          return {
            width: boundingClientRect.width || element.prop('offsetWidth'),
            height: boundingClientRect.height || element.prop('offsetHeight'),
            top: boundingClientRect.top + ($window.pageYOffset || scrollableContainer.scrollTop - scrollableContainer.offsetTop),
            left: boundingClientRect.left + ($window.pageXOffset || scrollableContainer.scrollLeft - scrollableContainer.offsetLeft)
          };
        },

        /**
         * get the event object for touch.
         *
         * @param  {Object} event the touch event
         * @return {Object} the touch event object.
         */
        eventObj: function (event) {
          var obj = event;
          if (event.targetTouches !== undefined) {
            obj = event.targetTouches.item(0);
          } else if (event.originalEvent !== undefined && event.originalEvent.targetTouches !== undefined) {
            obj = event.originalEvent.targetTouches.item(0);
          }
          return obj;
        },

        /**
         * Checks whether the touch is valid and multiple.
         *
         * @param event the event object.
         * @returns {boolean} true if touch is multiple.
         */
        isTouchInvalid: function (event) {

          var touchInvalid = false;
          if (event.touches !== undefined && event.touches.length > 1) {
            touchInvalid = true;
          } else if (event.originalEvent !== undefined &&
            event.originalEvent.touches !== undefined && event.originalEvent.touches.length > 1) {
            touchInvalid = true;
          }
          return touchInvalid;
        },

        /**
         * Get the start position of the target element according to the provided event properties.
         *
         * @param {Object} event Event
         * @param {Object} target Target element
         * @param {Object} [scrollableContainer] (optional) Scrollable container object
         * @returns {Object} Object with properties offsetX, offsetY.
         */
        positionStarted: function (event, target, scrollableContainer) {
          var pos = {};
          pos.offsetX = event.pageX - this.offset(target, scrollableContainer).left;
          pos.offsetY = event.pageY - this.offset(target, scrollableContainer).top;
          pos.startX = pos.lastX = event.pageX;
          pos.startY = pos.lastY = event.pageY;
          pos.nowX = pos.nowY = pos.distX = pos.distY = pos.dirAx = 0;
          pos.dirX = pos.dirY = pos.lastDirX = pos.lastDirY = pos.distAxX = pos.distAxY = 0;
          return pos;
        },

        /**
         * Calculates the event position and sets the direction
         * properties.
         *
         * @param pos the current position of the element.
         * @param event the move event.
         */
        calculatePosition: function (pos, event) {
          // mouse position last events
          pos.lastX = pos.nowX;
          pos.lastY = pos.nowY;

          // mouse position this events
          pos.nowX = event.pageX;
          pos.nowY = event.pageY;

          // distance mouse moved between events
          pos.distX = pos.nowX - pos.lastX;
          pos.distY = pos.nowY - pos.lastY;

          // direction mouse was moving
          pos.lastDirX = pos.dirX;
          pos.lastDirY = pos.dirY;

          // direction mouse is now moving (on both axis)
          pos.dirX = pos.distX === 0 ? 0 : pos.distX > 0 ? 1 : -1;
          pos.dirY = pos.distY === 0 ? 0 : pos.distY > 0 ? 1 : -1;

          // axis mouse is now moving on
          var newAx = Math.abs(pos.distX) > Math.abs(pos.distY) ? 1 : 0;

          // calc distance moved on this axis (and direction)
          if (pos.dirAx !== newAx) {
            pos.distAxX = 0;
            pos.distAxY = 0;
          } else {
            pos.distAxX += Math.abs(pos.distX);
            if (pos.dirX !== 0 && pos.dirX !== pos.lastDirX) {
              pos.distAxX = 0;
            }

            pos.distAxY += Math.abs(pos.distY);
            if (pos.dirY !== 0 && pos.dirY !== pos.lastDirY) {
              pos.distAxY = 0;
            }
          }
          pos.dirAx = newAx;
        },

        /**
         * Move the position by applying style.
         *
         * @param event the event object
         * @param element - the dom element
         * @param pos - current position
         * @param container - the bounding container.
         * @param containerPositioning - absolute or relative positioning.
         * @param {Object} [scrollableContainer] (optional) Scrollable container object
         */
        movePosition: function (event, element, pos, container, containerPositioning, scrollableContainer) {
          var bounds;
          var useRelative = (containerPositioning === 'relative');

          element.x = event.pageX - pos.offsetX;
          element.y = event.pageY - pos.offsetY;

          if (container) {
            bounds = this.offset(container, scrollableContainer);

            if (useRelative) {
              // reduce positioning by bounds
              element.x -= bounds.left;
              element.y -= bounds.top;

              // reset bounds
              bounds.left = 0;
              bounds.top = 0;
            }

            if (element.x < bounds.left) {
              element.x = bounds.left;
            } else if (element.x >= bounds.width + bounds.left - this.offset(element).width) {
              element.x = bounds.width + bounds.left - this.offset(element).width;
            }
            if (element.y < bounds.top) {
              element.y = bounds.top;
            } else if (element.y >= bounds.height + bounds.top - this.offset(element).height) {
              element.y = bounds.height + bounds.top - this.offset(element).height;
            }
          }

          element.css({
            'left': element.x + 'px',
            'top': element.y + 'px'
          });

          this.calculatePosition(pos, event);
        },

        /**
         * The drag item info and functions.
         * retains the item info before and after move.
         * holds source item and target scope.
         *
         * @param item - the drag item
         * @returns {{index: *, parent: *, source: *,
                 *          sourceInfo: {index: *, itemScope: (*|.dragItem.sourceInfo.itemScope|$scope.itemScope|itemScope), sortableScope: *},
                 *         moveTo: moveTo, isSameParent: isSameParent, isOrderChanged: isOrderChanged, eventArgs: eventArgs, apply: apply}}
         */
        dragItems: function(items){
          return {
            index: null,
            parent: null,
            sources: items,
            isSameParent: function(source){
              if(!this.parent) {
                return true;
              }
              return this.parent.element === source.sortableScope.element;
            },
            allSameParent: function(){
              var allSame = true;
              for(var i = 0; i < this.sources.length; i++) {
                var source = this.sources[i];
                if(!this.isSameParent(source)) {
                  allSame = false;
                  break;
                }
              }
              return allSame;
            },
            isOrderChanged: function () {
              var allSame = true;
              if(!this.index) {
                return false;
              }
              for(var i = 0; i < this.sources.length; i++) {
                var source = this.sources[i];
                if(this.index !== source.index()) {
                  allSame = false;
                  break;
                }
              }
              return !allSame;
            },
            moveTo: function(parent, index){
              this.parent = parent;
              // if the source item is in the same parent, the target index is after the source index and we're not cloning
              var numberOfSelectedBefore = 0;
              for(var i = 0; i < this.sources.length; i++){
                var source = this.sources[i];
                if (this.isSameParent(source) && source.index() < index && !source.sortableScope.cloning){
                  numberOfSelectedBefore++;
                }
              }
              index -= numberOfSelectedBefore;
              this.index = index;
            },
            apply: function(){
              // Remove existing
              for(var i = 0; i < this.sources.length; i++) {
                var source = this.sources[i];
                if(!source.sortableScope.cloning){
                  // if not cloning, remove the item from the source model.
                  source.sortableScope.removeItem(source.modelValue);
                }
              }
              // Insert new
              for(var i = 0; i < this.sources.length; i++) {
                var source = this.sources[i];
                var parent = this.parent ? this.parent : source.sortableScope;
                var index = this.index === null ? source.index() : this.index + i;
                if(!source.sortableScope.cloning){
                  if (parent.options.allowDuplicates || parent.modelValue.indexOf(source.modelValue) < 0) {
                    parent.insertItem(index, source.modelValue);
                  }
                } else if (!parent.options.clone) {
                  // clone the model value as well
                  parent.insertItem(index, angular.copy(source.modelValue));
                }
              }

            },
            eventArgs: function(){
              var self = this;
              var sourcesInfo = [];
              
              for(var i = 0; i < this.sources.length; i++){
                var source = this.sources[i];
                sourcesInfo.push({
                  scope: source,
                  index: source.index(),
                  parentScope: source.sortableScope
                });
              }

              var dest = {
                scope: self.parent,
                index: self.index
              };

              return {
                sourcesInfo: sourcesInfo,
                dest: dest
              };
            }
          };
        },

        /**
         * Check the drag is not allowed for the element.
         *
         * @param element - the element to check
         * @returns {boolean} - true if drag is not allowed.
         */
        noDrag: function (element) {
          return element.attr('no-drag') !== undefined || element.attr('data-no-drag') !== undefined;
        },

        /**
         * Helper function to find the first ancestor with a given selector
         * @param el - angular element to start looking at
         * @param selector - selector to find the parent
         * @returns {Object} - Angular element of the ancestor or body if not found
         * @private
         */
        findAncestor: function (el, selector) {
          var matches = Element.matches || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector || Element.prototype.webkitMatchesSelector;
          while ((el = el.parentElement) && !matches.call(el, selector)) {
          }
          return el ? angular.element(el) : angular.element(document.body);
        },

        /**
         * Fetch scope from element or parents
         * @param  {object} element Source element
         * @return {object}         Scope, or null if not found
         */
        fetchScope: function (element) {
          var scope;
          while (!scope && element.length) {
            scope = element.data('_scope');
            if (!scope) {
              element = element.parent();
            }
          }
          return scope;
        },

        orderSelected: function(selected){
          selected.sort(function(selectedA, selectedB){
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
        },

        isSelected: function(selected, itemScope, hashKey){
          var index = selected.indexOf(itemScope);
          if(index === -1) {
            if (hashKey === undefined) {
              return false;
            } else {
              for(var i = 0; i < selected.length; i++){
                if(selected[i].modelValue.$$hashKey === hashKey){
                  index = i;
                  // Swap out the itemScope to new one
                  selected[index] = itemScope;
                  this.orderSelected(selected);
                  break;
                }
              }
              return index !== -1;
            }
          } else {
            return true;
          }
        },

        isCloning: function(selected, shift) {
          selected.sortableScope.cloning = selected.sortableScope.options.clone || (selected.sortableScope.options.ctrlClone && shift);
          return selected.sortableScope.cloning;
        },
        //Check if a node is parent to another node
        isParent: function(possibleParent, elem) {
          if(!elem || elem.nodeName === 'HTML') {
            return false;
          }

          if(elem.parentNode === possibleParent) {
            return true;
          }

          return this.isParent(possibleParent, elem.parentNode);
        },

        debounceCall: (function(){
          // Closure to store timeouts
          var timeouts = {};

          return function(signature, func, params, timeout) { // Callbacks are always called with last params passed in
            if(timeouts[signature]){
              $timeout.cancel(timeouts[signature]);
            }
            var promise = $timeout(function(){
              func.call({},params);
            }, timeout);
            timeouts[signature] = promise;
          };
        })()

      };
    }
  ]);

}());

/*jshint indent: 2 */
/*global angular: false */

(function () {
  'use strict';

  var mainModule = angular.module('as.sortable');

  /**
   * Helper factory for sortable.
   */
  mainModule.factory('SortableEventBus', ['$document', '$window', function($document, $window){
  	// Really want to use es6 class but can't be fucked compiling using babel so use prototypes instead
  	function SortableEventBus(events){
  		this.eventBus = {};
		for(var i = 0; i < events.length; i++) {
			let eventName = events[i];
			this.eventBus[eventName] = [];
		}
  	}

  	SortableEventBus.prototype = {
  		on: function(eventName, callback) {
  			this.eventBus[eventName] = this.eventBus[eventName] || [];
  			this.eventBus[eventName].push(callback);
  		},
  		fire: function(eventName, args) {
  			var callbacks = this.eventBus[eventName];
  			if(!callbacks || callbacks.length < 1){
  				return;
  			}
  			var results = [];
  			for(var i = 0; i < callbacks.length; i++){
  				let result = callbacks[i].apply({}, args);
  				results.push(result);
  			}
  			return results;
  		}
  	};

  	return SortableEventBus;
  }]);

 })();
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

          var initiatedEventBus = false;
          function initiateEventBus(eventBus){
            eventBus.on("deselectAll", function(){
              scope.removeAllFromSelected();
            });

            eventBus.on("deselect", function(index){
              return;
            });

            eventBus.on("getSelected", function(){
              return scope.selected;
            });
          }

          scope.$watch(attrs.asSortableGroup, function (newVal, oldVal) {
            angular.forEach(newVal, function (value, key) {
              if(key === "eventBus") {
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
      $helper.debounceCall("selectionChanged", $scope.callbacks.selectionChanged, [$scope.selected], 1000); // Wait 1 second for user selection to finish
    };

    $scope.removeFromSelected = function(itemScope) {
      var idx = $scope.selected.indexOf(itemScope);
      if (idx > -1) {
        $scope.selected.splice(idx, 1);
      }
      itemScope.unselected();
      $helper.debounceCall("selectionChanged", $scope.callbacks.selectionChanged, [$scope.selected], 1000);
    };

    $scope.removeAllFromSelected = function(){
      while ($scope.selected.length > 0) {
        $scope.removeFromSelected($scope.selected[0]);
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
    };

    /**
     * Check there is no place holder placed by itemScope.
     * @param targetElement the target element to check with.
     * @returns {*} true if place holder present.
     */
    function isPlaceHolderPresent (targetElement) {
      return placeHolderIndex(targetElement) >= 0;
    };

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
      dragState.dragElementsContainer = angular.element("<div>").addClass(sortableConfig.dragClass);
      dragState.containment = angular.element($document[0].body);
      dragState.dragItemsInfo = $helper.dragItems($scope.selected);

      var itemElement = $helper.findAncestor(event.srcElement, '.as-sortable-item');
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
      var targetScope = $helper.fetchScope(targetElement);
      if (!targetScope || !targetScope.type) {
        return;
      }

      $helper.movePosition(eventObj, dragState.dragElementsContainer, dragState.itemPosition, dragState.containment, 'absolute', scrollableContainer);

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
        if (!$helper.isParent(targetScope.element[0], targetElement[0])) {
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

/*jshint indent: 2 */
/*global angular: false */

(function () {

  'use strict';
  var mainModule = angular.module('as.sortable');

  /**
   * Controller for sortableItemHandle
   *
   * @param $scope - item handle scope.
   */
  mainModule.controller('as.sortable.sortableItemHandleController', ['$scope', function ($scope) {

    this.scope = $scope;

    $scope.itemScope = null;
    $scope.type = 'handle';
  }]);

  /**
   * Directive for sortable item handle.
   */
  mainModule.directive('asSortableItemHandle', ['sortableConfig', '$helper', '$window', '$document', '$timeout',
    function (sortableConfig, $helper, $window, $document, $timeout) {
      return {
        require: '^asSortableItem',
        scope: true,
        restrict: 'A',
        controller: 'as.sortable.sortableItemHandleController',
        link: function (scope, element, attrs, itemController) {

            var dragListen,// drag listen event.
            dragStart,// drag start event.
            dragMove,//drag move event.
            dragEnd,//drag end event.
            dragCancel,//drag cancel event.
            isDraggable,//is element draggable.
            bindDrag,//bind drag events.
            unbindDrag,//unbind drag events.
            bindEvents,//bind the drag events.
            unBindEvents,//unbind the drag events.
            hasTouch,// has touch support.
            isIOS,// is iOS device.
            longTouchStart, // long touch start event
            longTouchCancel, // cancel long touch
            longTouchTimer, // timer promise for the long touch on iOS devices
            dragHandled, //drag handled.
            createPlaceholder,//create place holder.
            isPlaceHolderPresent,//is placeholder present.
            isDisabled = false, // drag enabled
            escapeListen, // escape listen event
            isLongTouch = false; //long touch disabled.

          hasTouch = 'ontouchstart' in $window;
          isIOS = /iPad|iPhone|iPod/.test($window.navigator.userAgent) && !$window.MSStream;

          if (sortableConfig.handleClass) {
            element.addClass(sortableConfig.handleClass);
          }

          scope.itemScope = itemController.scope;
          element.data('_scope', scope); // #144, work with angular debugInfoEnabled(false)

          scope.$watchGroup(['sortableScope.isDisabled', 'sortableScope.options.longTouch'],
              function (newValues) {
            if (isDisabled !== newValues[0]) {
              isDisabled = newValues[0];
              if (isDisabled) {
                unbindDrag();
              } else {
                bindDrag();
              }
            } else if (isLongTouch !== newValues[1]) {
              isLongTouch = newValues[1];
              unbindDrag();
              bindDrag();
            } else {
              bindDrag();
            }
          });

          scope.$on('$destroy', function () {
            angular.element($document[0].body).unbind('keydown', escapeListen);
          });

          createPlaceholder = function (itemScope) {
            if (typeof scope.sortableScope.options.placeholder === 'function') {
              return angular.element(scope.sortableScope.options.placeholder(itemScope));
            } else if (typeof scope.sortableScope.options.placeholder === 'string') {
              return angular.element(scope.sortableScope.options.placeholder);
            } else {
              return angular.element($document[0].createElement(itemScope.element.prop('tagName')));
            }
          };

          /**
           * Listens for a 10px movement before
           * dragStart is called to allow for
           * a click event on the element.
           *
           * @param event - the event object.
           */
          dragListen = function (event) {

            var unbindMoveListen = function () {
              angular.element($document).unbind('mousemove', moveListen);
              angular.element($document).unbind('touchmove', moveListen);
              element.unbind('mouseup', unbindMoveListen);
              element.unbind('touchend', unbindMoveListen);
              element.unbind('touchcancel', unbindMoveListen);
            };

            var startPosition;
            var moveListen = function (e) {
              e.preventDefault();
              var eventObj = $helper.eventObj(e);
              if (!startPosition) {
                startPosition = { clientX: eventObj.clientX, clientY: eventObj.clientY };
              }
              if (Math.abs(eventObj.clientX - startPosition.clientX) + Math.abs(eventObj.clientY - startPosition.clientY) > 10) {
                unbindMoveListen();
                dragStart(event);
              }
            };

            angular.element($document).bind('mousemove', moveListen);
            angular.element($document).bind('touchmove', moveListen);
            element.bind('mouseup', unbindMoveListen);
            element.bind('touchend', unbindMoveListen);
            element.bind('touchcancel', unbindMoveListen);
            event.stopPropagation();
          };

          /**
           * Triggered when drag event starts.
           *
           * @param event the event object.
           */
          dragStart = function (event) {

            var eventObj, tagName;

            if (!hasTouch && (event.button === 2 || event.which === 3)) {
              // disable right click
              return;
            }
            if (hasTouch && $helper.isTouchInvalid(event)) {
              return;
            }
            if (dragHandled || !isDraggable(event)) {
              // event has already fired in other scope.
              return;
            }
            // Set the flag to prevent other items from inheriting the drag event
            dragHandled = true;
            event.preventDefault();

            scope.itemScope.sortableScope.groupScope.dragStart(event);
            bindEvents();
          };

          /**
           * Allow Drag if it is a proper item-handle element.
           *
           * @param event - the event object.
           * @return boolean - true if element is draggable.
           */
          isDraggable = function (event) {

            var elementClicked, sourceScope, isDraggable;

            elementClicked = angular.element(event.target);

            // look for the handle on the current scope or parent scopes
            sourceScope = fetchScope(elementClicked);

            isDraggable = (sourceScope && sourceScope.type === 'handle');

            //If a 'no-drag' element inside item-handle if any.
            while (isDraggable && elementClicked[0] !== element[0]) {
              if ($helper.noDrag(elementClicked)) {
                isDraggable = false;
              }
              elementClicked = elementClicked.parent();
            }
            return isDraggable;
          };

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
           * Triggered when drag is moving.
           *
           * @param event - the event object.
           */
          dragMove = function (event) {

            var eventObj, targetX, targetY, targetScope, targetElement;

            if (hasTouch && $helper.isTouchInvalid(event)) {
              return;
            }
            // Ignore event if not handled
            if (!dragHandled) {
              return;
            }

            event.preventDefault();
            scope.itemScope.sortableScope.groupScope.dragMove(event);
          };

          /**
           * Rollback the drag data changes.
           */

          function rollbackDragChanges() {
            if (!scope.itemScope.sortableScope.cloning) {
              placeElement.replaceWith(scope.itemScope.element);
            }
            placeHolder.remove();
            dragElement.remove();
            dragElement = null;
            dragHandled = false;
            containment.css('cursor', '');
            containment.removeClass('as-sortable-un-selectable');
          }

          /**
           * triggered while drag ends.
           *
           * @param event - the event object.
           */
          dragEnd = function (event) {
            // Ignore event if not handled
            if (!dragHandled) {
              return;
            }
            event.preventDefault();
            scope.itemScope.sortableScope.groupScope.dragEnd(event);
            dragHandled = false;
            unBindEvents();
          };

          /**
           * triggered while drag is cancelled.
           *
           * @param event - the event object.
           */
          dragCancel = function (event) {
            // Ignore event if not handled
            if (!dragHandled) {
              return;
            }
            event.preventDefault();
            scope.itemScope.sortableScope.groupScope.dragEnd(event, true);
            unBindEvents();
          };

          /**
           * Binds the drag start events.
           */
          bindDrag = function () {
            if (hasTouch) {
              if (isLongTouch) {
                if (isIOS) {
                  element.bind('touchstart', longTouchStart);
                  element.bind('touchend', longTouchCancel);
                  element.bind('touchmove', longTouchCancel);
                } else {
                  element.bind('contextmenu', dragListen);
                }
              } else {
                element.bind('touchstart', dragListen);
              }
            }
            element.bind('mousedown', dragListen);
          };

          /**
           * Unbinds the drag start events.
           */
          unbindDrag = function () {
            element.unbind('touchstart', longTouchStart);
            element.unbind('touchend', longTouchCancel);
            element.unbind('touchmove', longTouchCancel);
            element.unbind('contextmenu', dragListen);
            element.unbind('touchstart', dragListen);
            element.unbind('mousedown', dragListen);
          };

          /**
           * starts a timer to detect long touch on iOS devices. If touch held for more than 500ms,
           * it would be considered as long touch.
           *
           * @param event - the event object.
           */
          longTouchStart = function(event) {
            longTouchTimer = $timeout(function() {
              dragListen(event);
            }, 500);
          };

          /**
           * cancel the long touch and its timer.
           */
          longTouchCancel = function() {
            $timeout.cancel(longTouchTimer);
          };

          //bind drag start events.
          //put in a watcher since this method is now depending on the longtouch option from sortable.sortOptions
          //bindDrag();

          //Cancel drag on escape press.
          escapeListen = function (event) {
            if (event.keyCode === 27) {
              dragCancel(event);
            }
          };
          angular.element($document[0].body).bind('keydown', escapeListen);

          /**
           * Binds the events based on the actions.
           */
          bindEvents = function () {
            angular.element($document).bind('touchmove', dragMove);
            angular.element($document).bind('touchend', dragEnd);
            angular.element($document).bind('touchcancel', dragCancel);
            angular.element($document).bind('mousemove', dragMove);
            angular.element($document).bind('mouseup', dragEnd);
          };

          /**
           * Un binds the events for drag support.
           */
          unBindEvents = function () {
            angular.element($document).unbind('touchend', dragEnd);
            angular.element($document).unbind('touchcancel', dragCancel);
            angular.element($document).unbind('touchmove', dragMove);
            angular.element($document).unbind('mouseup', dragEnd);
            angular.element($document).unbind('mousemove', dragMove);
          };
        }
      };
    }]);

}());

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
      }
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
      console.log("insert before");
      // Ensure the placeholder is visible in the target (unless it's a table row)
      if (placeHolder.css('display') !== 'table-row') {
        placeHolder.css('display', 'block');
      }
      if (!targetScope.sortableScope.options.clone) {
        targetElement[0].parentNode.insertBefore(placeHolder[0], targetElement[0]);
        dragItemsInfo.moveTo(targetScope.sortableScope, targetScope.index());
      }
    }

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
    }

    $scope.appendPlaceHolder = function(targetElement){
      targetElement[0].appendChild(placeHolder[0]);
    }

    $scope.rollbackDragChanges = function(){
      if (!$scope.sortableScope.cloning) {
        placeElement.replaceWith($scope.element);
      }
      placeHolder.remove();
    }

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