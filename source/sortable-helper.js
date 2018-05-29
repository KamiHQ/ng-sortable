/*jshint indent: 2 */
/*global angular: false */

(function () {
  'use strict';

  var mainModule = angular.module('as.sortable');

  /**
   * Helper factory for sortable.
   */
  mainModule.factory('$helper', ['$document', '$window',
    function ($document, $window) {
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
        }

      };
    }
  ]);

}());
