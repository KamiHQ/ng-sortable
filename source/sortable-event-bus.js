/*jshint indent: 2 */
/*global angular: false */

(function () {
  'use strict';

  var mainModule = angular.module('as.sortable');

  /**
   * Helper factory for sortable.
   */
  mainModule.factory('SortableEventBus', ['$document', '$window', function($document, $window){
  	class SortableEventBus {
  		constructor(events) {
  			this.eventBus = {};
  			for(var i = 0; i < events.length; i++) {
  				let eventName = events[i];
  				this.eventBus[eventName] = [];
  			}
  		}

  		on(eventName, callback) {
  			this.eventBus[eventName] = this.eventBus[eventName] || [];
  			this.eventBus[eventName].push(callback);
  		}

  		fire(eventName, args) {
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
  	}

  	return SortableEventBus;
  }]);

 })();