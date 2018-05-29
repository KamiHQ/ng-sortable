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