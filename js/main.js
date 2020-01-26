//Guardian-specific responsive iframe function

iframeMessenger.enableAutoResize();
var firstRun = true;

function init(results) {

	console.log(results)
	clone = JSON.parse(JSON.stringify(results));

	var data = clone['sheets']['data']
	var details = clone['sheets']['details']
	var labels = clone['sheets']['labels']
	var periods = clone['sheets']['periods']
	var userKey = clone['sheets']['key']
	var optionalKey = {};
	var x_axis_cross_y = null;

	if (userKey.length > 1) { 
		userKey.forEach(function (d) {
			optionalKey[d.keyName] = d.colour; 
		})
	}

	function numberFormat(num) {
        if ( num > 0 ) {
            if ( num > 1000000000 ) { return ( num / 1000000000 ) + 'bn' }
            if ( num > 1000000 ) { return ( num / 1000000 ) + 'm' }
            if ( num > 1000 ) { return ( num / 1000 ) + 'k' }
            if (num % 1 != 0) { return num.toFixed(2) }
            else { return num.toLocaleString() }
        }
        if ( num < 0 ) {
            var posNum = num * -1;
            if ( posNum > 1000000000 ) return [ "-" + String(( posNum / 1000000000 )) + 'bn'];
            if ( posNum > 1000000 ) return ["-" + String(( posNum / 1000000 )) + 'm'];
            if ( posNum > 1000 ) return ["-" + String(( posNum / 1000 )) + 'k'];
            else { return num.toLocaleString() }
        }
        return num;
    }

    d3.select("#chartTitle").text(details[0].title)
    d3.select("#subTitle").text(details[0].subtitle)
    if (details[0].source != "") {
    	d3.select("#sourceText").html(" | Source: " + details[0].source)	
    }

    if (details[0].x_axis_cross_y != '') {
			x_axis_cross_y = +details[0].x_axis_cross_y
	}

    d3.select("#footnote").html(details[0].footnote)

    var chartKey = d3.select("#chartKey");

	var isMobile;
	var windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

	if (windowWidth < 610) {
			isMobile = true;
	}	

	if (windowWidth >= 610){
			isMobile = false;
	}

	var width = document.querySelector("#graphicContainer").getBoundingClientRect().width
	var height = width*0.6;

	var margin;
	if (details[0]['margin-top']) {
		margin = {top: +details[0]['margin-top'], right: +details[0]['margin-right'], bottom: +details[0]['margin-bottom'], left:+details[0]['margin-left']};
	}

	else {
		margin = {top: 0, right: 0, bottom: 20, left:40};	
	}					
	
	var breaks = 'yes'; 

	if (details[0]['breaks']) {
		breaks = details[0]['breaks'];
	}


	var colors = ['#4daacf','#5db88b','#a2b13e','#8a6929','#b05cc6','#c8a466','#c35f95','#ce592e','#d23d5e','#d89a34','#7277ca','#527b39','#59b74b','#c76c65','#8a6929']

	width = width - margin.left - margin.right,
    height = height - margin.top - margin.bottom;
   

	d3.select("#graphicContainer svg").remove();
	chartKey.html("");

	var svg = d3.select("#graphicContainer").append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.attr("id", "svg")
				.attr("overflow", "hidden");					

	var features = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var keys = Object.keys(data[0])

	var xVar;

	if (details[0]['xColumn']) {
		xVar = details[0]['xColumn'];
		keys.splice(keys.indexOf(xVar), 1);
	}
	
	else {
		xVar = keys[0]
		keys.splice(0, 1);
	}
	console.log(xVar, keys);

	var x = d3.scaleTime()
		.rangeRound([0, width]);

	var y = d3.scaleLinear()
		.rangeRound([height, 0]);

	var color = d3.scaleOrdinal()
		.range(colors);	

	var lineGenerators = {};
	var allValues = [];

	keys.forEach(function(key,i) {

		if (breaks === "yes") {
		lineGenerators[key] = d3.line()
			.defined(function(d) {
        		return d;
    		})
			.x(function(d) { 
				return x(d[xVar]); 	
				})
			.y(function(d) { 
				return y(d[key]); 
			});
		}

		else if (breaks === "no") {
			lineGenerators[key] = d3.line()
				.x(function(d) { 
					return x(d[xVar]); 	
					})
				.y(function(d) { 
					return y(d[key]); 
				});
		}
		
		
		data.forEach(function(d) {

			if (typeof d[key] == 'string') {
				if (d[key].includes(",")) {
					if (!isNaN((d[key]).replace(/,/g, ""))) {
						d[key] = +(d[key]).replace(/,/g, "")
						allValues.push(d[key]);	
					}
					
				}
				else if (d[key] != "") {

					if (!isNaN(d[key])) {
						
						d[key] = +d[key]
						allValues.push(d[key]);
					}
				}

				else if (d[key] == "") {
					d[key] = null 
				}

			}
			
			
		});

	});

	// console.log(data)

	keys.forEach(function(key,i) { 

		var keyDiv = chartKey.append("div")
						.attr("class","keyDiv")

		keyDiv.append("span")
			.attr("class", "keyCircle")
			.style("background-color", function() {
				if (optionalKey.hasOwnProperty(key)) {
					return optionalKey[key];
				}

				else {
					return color(key);
				}
			})

		keyDiv.append("span")
			.attr("class", "keyText")
			.text(key)

	})
	
	console.log(details[0]['dateFormat'])
	var parseTime = d3.timeParse(details[0]['dateFormat']);
	var parsePeriods = d3.timeParse(details[0]['periodDateFormat']);

	data.forEach(function(d) {
		if (typeof d[xVar] == 'string') {	
			d[xVar] = parseTime(d[xVar]);
		}	
	})

	var keyData = {}

	keys.forEach(function(key,i) {
		keyData[key] = []

		data.forEach(function(d) {
			if (d[key] != null) {
				newData = {}
				newData[xVar] = d[xVar]
				newData[key] = d[key]
				keyData[key].push(newData)
			}
			else {
				keyData[key].push(null)
			}
			
		});
	})	

	console.log(keyData)
	labels.forEach(function(d,i) {
		if (typeof d.x == 'string') {
			d.x = parseTime(d.x);
		}	

		if (typeof d.y == 'string') {
			d.y = +d.y;
		}

		if (typeof d.offset == 'string') {
			d.offset = +d.offset;
		}

	})

	periods.forEach(function(d) {
		if (typeof d.start == 'string') {
			d.start = parsePeriods(d.start);
			d.end = parsePeriods(d.end);
			d.middle = middle = new Date( (d.start.getTime() + d.end.getTime())/2);
		}	
	})

	console.log(periods);
	var min;

	if (details[0]['baseline'] === 'zero') {
		min = 0;
	}

	else {
		min = d3.min(allValues);
	}
	x.domain(d3.extent(data, function(d) { return d[xVar]; }));
	y.domain([min, d3.max(allValues)]);

	console.log(x.domain());

	var xAxis;
	var yAxis;

	if (isMobile) {
		xAxis = d3.axisBottom(x).ticks(5);
		yAxis = d3.axisLeft(y).tickFormat(function (d) { return numberFormat(d)}).ticks(5);
	}

	else {
		xAxis = d3.axisBottom(x);
		yAxis = d3.axisLeft(y).tickFormat(function (d) { return numberFormat(d)});
	}

	d3.selectAll(".periodLine").remove();
	d3.selectAll(".periodLabel").remove(); 

	features.selectAll(".periodLine")
		.data(periods)
		.enter().append("line")
		.attr("x1", function(d,i) { 
			return x(d.start)
		})
		.attr("y1", 0)     
		.attr("x2", function(d,i) { 
			return x(d.start)
		})  
		.attr("y2", height)
		.attr("class","periodLine mobHide")
		.attr("stroke", "#bdbdbd")
		.attr("opacity",function(d) {
			if (d.start < x.domain()[0]) {
				return 0	
			}

			else {
				return 1
			}
			
		})
		.attr("stroke-width", 1);

	features.selectAll(".periodLine")
			.data(periods)
			.enter().append("line")
			.attr("x1", function(d,i) { 
				return x(d.end)
			})
			.attr("y1", 0)     
			.attr("x2", function(d,i) { 
				return x(d.end)
			})  
			.attr("y2", height)
			.attr("class","periodLine mobHide")
			.attr("stroke", "#bdbdbd")
			.attr("opacity",function(d) {
			if (d.end > x.domain()[1]) {
				return 0	
			}

			else {
				return 1
			}
			
		})
			.attr("stroke-width", 1);	

	features.selectAll(".periodLabel")
		.data(periods)
		.enter().append("text")
		.attr("x", function(d) { 
			if (d.labelAlign == 'middle')
			{
				return x(d.middle)	
			}

			else if (d.labelAlign == 'start') {
				return x(d.start) + 5	
			}
			
		})
		.attr("y", -5)
		.attr("text-anchor", function(d) {  
			return d.labelAlign
		
		})
		.attr("class", "periodLabel mobHide")
		.attr("opacity",1)
		.text(function(d) { return d.label});

	features.append("g")
		.attr("class","x")
		.attr("transform", function() {				
				
				if (x_axis_cross_y != null) {
					return "translate(0," + y(x_axis_cross_y) + ")"
				}

				else {
					return "translate(0," + height + ")"	
				}
			})
		.call(xAxis);

	features.append("g")
		.attr("class","y")
		.call(yAxis)

	features.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", "0.71em")
		.attr("fill", "#767676")
		.attr("text-anchor", "end")
		.text(details[0].yAxisLabel);

	features.append("text")
		.attr("x", width)
		.attr("y", height - 6)
		.attr("fill", "#767676")
		.attr("text-anchor", "end")
		.text(details[0].xAxisLabel);	

	d3.selectAll(".tick line")
		.attr("stroke", "#767676")

	d3.selectAll(".tick text")
		.attr("fill", "#767676")			

	d3.selectAll(".domain")
		.attr("stroke", "#767676")		


	keys.forEach(function(key,i) {

		features.append("path")
			.datum(keyData[key])
			.attr("fill", "none")
			.attr("stroke", function (d) { 
				console.log(d)
				if (optionalKey.hasOwnProperty(key)) {
					return optionalKey[key];
				}

				else {
					return color(key);
				}

				})
			.attr("stroke-linejoin", "round")
			.attr("stroke-linecap", "round")
			.attr("stroke-width", 1.5)
			.attr("d", lineGenerators[key]);

	});	

	function textPadding(d) {
		if (d.offset > 0) {
			return 12
		}

		else {
			return - 2
		}
	}

	function textPaddingMobile(d) {
		if (d.offset > 0) {
			return 12
		}

		else {
			return 4
		}
	}


	features.selectAll(".annotationLine")
		.data(labels)
		.enter().append("line")
		.attr("class", "annotationLine")
		.attr("x1", function(d) { return x(d.x); })
		.attr("y1", function(d) { return y(d.y) })
		.attr("x2", function(d) { return x(d.x); })
		.attr("y2", function(d) { return y(d.offset) })
		.style("opacity", 1)	
		.attr("stroke", "#000");  

	var footerAnnotations = d3.select("#footerAnnotations");
	
	footerAnnotations.html("");	

	if (isMobile) {

		features.selectAll(".annotationCircles")
				.data(labels)
				.enter().append("circle")
				.attr("class", "annotationCircle")
				.attr("cy", function(d) { return y(d.offset) + textPadding(d)/2})
				.attr("cx", function(d) { return x(d.x)})
				.attr("r", 8)
				.attr("fill", "#000");

		features.selectAll(".annotationTextMobile")
				.data(labels)
				.enter().append("text")
				.attr("class", "annotationTextMobile")
				.attr("y", function(d) { return y(d.offset) + textPaddingMobile(d)})
				.attr("x", function(d) { return x(d.x)})
				.style("text-anchor", "middle")
				.style("opacity", 1)
				.attr("fill", "#FFF")
				.text(function(d,i) { 
					return i + 1
				});	
		console.log(labels.length)
		
		if (labels.length > 0) {
			footerAnnotations.append("span")
				.attr("class", "annotationFooterHeader")
				.text("Notes: ");
		}

		

		labels.forEach(function(d,i) { 

			

			footerAnnotations.append("span")
				.attr("class", "annotationFooterNumber")
				.text(i+1 + " - ");

			if (i < labels.length -1 ) {
				footerAnnotations.append("span")
				.attr("class", "annotationFooterText")
				.text(d.text + ", ");
			}
			
			else {
				footerAnnotations.append("span")
					.attr("class", "annotationFooterText")
					.text(d.text);
			}	

			

		})		

	}

	else {

		features.selectAll(".annotationText")
			.data(labels)
			.enter().append("text")
			.attr("class", "annotationText")
			.attr("y", function(d) { return y(d.offset) + textPadding(d)})
			.attr("x", function(d) { return x(d.x)})
			.style("text-anchor", function(d) { return d.align })
			.style("opacity", 1)
			.text(function(d) {return d.text});

	}

	
	
	firstRun = false

} // end init


function getParameter(paramName) {
	var searchString = window.location.search.substring(1),
	i, val, params = searchString.split("&");

	for (i=0;i<params.length;i++) {
	val = params[i].split("=");
	if (val[0] == paramName) {
	return val[1];
	}
	}
	return null;
}

key = getParameter('key');

var q = d3.queue()
    .defer(d3.json, "https://interactive.guim.co.uk/docsdata/" + key + ".json")
    .awaitAll(function(error, results) {
		init(results[0])
		var to=null
		var lastWidth = document.querySelector("#graphicContainer").getBoundingClientRect()
		window.addEventListener('resize', function() {
			var thisWidth = document.querySelector("#graphicContainer").getBoundingClientRect()
			if (lastWidth != thisWidth) {
				window.clearTimeout(to);
				to = window.setTimeout(function() {
						console.log("resize")
					    init(results[0])
					}, 100)
			}
		})
    });
