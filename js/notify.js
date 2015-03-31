(function(app, $){
	'use strict';
	
	app.notify = app.notify || {};

	/**
	 * Notification
	 * @return {object}
	 */
	
	app.notify = (function(){
		var $notifyBox = null;
		var _init = function(){
			$notifyBox = $('<div class="mynotify"></div>');
			$('body').append($notifyBox);

			// for test
			// o.add('test');
			// o.add('Success noti', null, 'success');
			// o.add('Error noti', null, 'error');
		};

		var o = {
			add: function(text, initAnimate, type){
				var $noti = $('<div class="noti">'+text+'</div>');
				if(type){
					this.addStyle($noti, type);
				}
				$notifyBox.append($noti);
				$noti.initAnimate = this.initAnimate;

				if(initAnimate){
					setTimeout(function(){
						$noti.initAnimate(initAnimate);
					}, 2000);
				}

				return $noti;
			},
			init: function(){
				_init();
			},
			addStyle: function($el, type){
				if(arguments.length === 1)
					$el = this;
				switch(type){
					case "success":
						$el.addClass('success');
						break;
					case "error":
						$el.addClass('error');
						break;
				}

				return this;
			},
			initAnimate: function(duration){
				if(duration && (_.isNumber(duration)) && duration > 0)
					this.css('transition', Math.floor(duration/1000)+'s');

				this.addClass('h');
				this.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function() {
					this.remove ? this.remove() : $(this).remove();
				});
			}
		};
		return o;
	}());

	return app;
})(app || {}, jQuery);