(function(){
	
	sven.time = {};
	
	// try to find the best interval
	sven.time.timeline = function(){
		
		var min,
			max,
			intervals = ['days','weeks','months','years'],
			interval,
			limit = 30
		
		function timeline(data){
			
			var _data = data;
			
			var _min = min ? min : null;
			var _max = max ? max : null;
			
			// find the best interval
			for (var i in intervals){
				var nested = sven.time[intervals[i]]()
					.min(_min)
					.max(_max)
				if ( nested(data).length <= limit ){
					interval = sven.time[intervals[i]]
					break;	
				}
			}			
			return interval()
				.min(_min)
				.max(_max)(data);
		}
		
		
		timeline.data = function() {
			return timeline._data;
		}

		timeline.min = function(x) {
			if (!arguments.length) return min;
			min = x;
			return timeline;
		}

		timeline.max = function(x) {
			if (!arguments.length) return max;
			max = x;
			return timeline;
		}

		timeline.property = function(x) {
			if (!arguments.length) return property;
			property = x;
			return timeline;
		}
		
		timeline.limit = function(x) {
			if (!arguments.length) return limit;
			limit = x;
			return timeline;
		}
		
		timeline.interval = function() {
			return interval().interval();
		}
		
		timeline.format = function() {
			return interval().format();
		}
		
		return timeline;
		
	}
	
	// Nest data in years
	sven.time.years = function(){
		
		var min,
			max,
			format = d3.time.format("%Y"),
			property = "date",
			interval = d3.time.year
		
		function years(data){
			
			var nest = d3.nest()
				.key(function(d){ return d3.time.year(d[property]); })
				.map(data);
			
			if (!min) min = d3.first(data)[property]//d3.time.year(d3.first(data)[property])
			if (!max) max = d3.last(data)[property]//d3.time.year(d3.time.year.offset(d3.last(data)[property],1))
			
			var range = d3.time.years(d3.time.year.floor(min), max)
			
			return range.map(function(d){
				if (!nest.hasOwnProperty(d)) {
					return { key : d, value : [] };
				} else return { key : d, value : nest[d] };
			}).sort(function(a, b){
				a = new Date(a.key)
				b = new Date(b.key)
				return a > b ? 1 : a == b ? 0 : -1;
			})
			
		}
		
		years.min = function(x) {
			if (!arguments.length) return min;
			min = x;
			return years;
		}

		years.max = function(x) {
			if (!arguments.length) return max;
			max = x;
			return years;
		}
		
		years.property = function(x) {
			if (!arguments.length) return property;
			property = x;
			return years;
		}
		
		years.format = function() {
			return format;
		}
		
		years.interval = function() {
			return interval;
		}
		
		return years;
	}

	// Nest data in months
	sven.time.months = function(){
		
		var min,
			max,
			format = d3.time.format("%m"),
			property = "date",
			interval = d3.time.month
		
		function months(data){
			
			var nest = d3.nest()
				.key(function(d){ return d3.time.month(d[property]); })
				.map(data);
			
			if (!min) min = d3.time.month(d3.first(data)[property])
			if (!max) max = d3.time.month(d3.time.month.offset(d3.last(data)[property],1))
			
			var range = d3.time.months(d3.time.month.floor(min), max)

			return range.map(function(d){
				if (!nest.hasOwnProperty(d)) {
					return { key : d, value : [] };
				} else return { key : d, value : nest[d] };
			}).sort(function(a, b){
				a = new Date(a.key)
				b = new Date(b.key)
				return a > b ? 1 : a == b ? 0 : -1;
			})
			
		}
		
		months.min = function(x) {
			if (!arguments.length) return min;
			min = x;
			return months;
		}

		months.max = function(x) {
			if (!arguments.length) return max;
			max = x;
			return months;
		}
		
		months.property = function(x) {
			if (!arguments.length) return property;
			property = x;
			return months;
		}
		
		months.format = function() {
			return format;
		}
		
		months.interval = function() {
			return interval;
		}
		
		return months;
	}

	// Nest data in weeks
	sven.time.weeks = function(){
		
		var min,
			max,
			format = d3.time.format("%d/%m"),
			property = "date",
			interval = d3.time.week
		
		function weeks(data){
			
			var nest = d3.nest()
				.key(function(d){ return d3.time.week(d[property]); })
				.map(data);
			
			if (!min) min = d3.time.week(d3.first(data)[property])
			if (!max) max = d3.time.week(d3.time.week.offset(d3.last(data)[property],1))
			
			var range = d3.time.weeks(d3.time.week.floor(min), max)
			
			return range.map(function(d){
				if (!nest.hasOwnProperty(d)) {
					return { key : d, value : [] };
				} else return { key : d, value : nest[d] };
			}).sort(function(a, b){
				a = new Date(a.key)
				b = new Date(b.key)
				return a > b ? 1 : a == b ? 0 : -1;
			})
			
		}
		
		weeks.min = function(x) {
			if (!arguments.length) return min;
			min = x;
			return weeks;
		}

		weeks.max = function(x) {
			if (!arguments.length) return max;
			max = x;
			return weeks;
		}
		
		weeks.property = function(x) {
			if (!arguments.length) return property;
			property = x;
			return weeks;
		}
		
		weeks.format = function() {
			return format;
		}
		
		weeks.interval = function() {
			return interval;
		}
		
		return weeks;
	}
	
	// Nest data in days
	sven.time.days = function(){
		
		var min,
			max,
			format = d3.time.format("%d")
			property = "date",
			interval = d3.time.day
		
		function days(data){
			
			var nest = d3.nest()
				.key(function(d){ return d3.time.day(d[property]); })
				.map(data);
			
			if (!min) min = d3.time.month(d3.first(data)[property])
			if (!max) max = d3.time.month(d3.time.month.offset(d3.last(data)[property],1))
			
			var range = d3.time.days(min, max)
			
			return range.map(function(d){
				if (!nest.hasOwnProperty(d)) {
					return { key : d, value : [] };
				} else return { key : d, value : nest[d] };
			}).sort(function(a, b){
				a = new Date(a.key)
				b = new Date(b.key)
				return a > b ? 1 : a == b ? 0 : -1;
			})
			
		}
		
		days.min = function(x) {
			if (!arguments.length) return min;
			min = x;
			return days;
		}

		days.max = function(x) {
			if (!arguments.length) return max;
			max = x;
			return days;
		}
		
		days.property = function(x) {
			if (!arguments.length) return property;
			property = x;
			return days;
		}
		
		days.format = function() {
			return format;
		}
		
		days.interval = function() {
			return interval;
		}
		
		return days;
	}
	
})();