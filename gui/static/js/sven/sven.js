(function(){
	
	sven = {};
	
	sven.colors = {}
	
	sven.colors.diverging = function(c){
		
		var classes = c ? c : 1,
			values = {},
			saturation = .4,
			light = .6;
		
		diverging = function(x){
			
			if(!values.x) {
				var length = d3.keys(values).length
				values[x] = d3.hsl( 360/c*(length+1), saturation, light ).toString()
			}
			return values[x];
		}
		
		diverging.saturation = function(x){
			if (!arguments.length) return saturation;
			saturation = x;
			return diverging;
		}
		
		diverging.values = function(name,value){
			if (!arguments.length) return values;
			if (arguments.length == 1) return values[name];
			values[name] = value;
			return diverging;
		}
		
		diverging.light = function(x){
			if (!arguments.length) return light;
			light = x;
			return diverging;
		}
		
		return diverging;
		
	}
	
})();