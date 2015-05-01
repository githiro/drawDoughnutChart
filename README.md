jquery.drawDoughnutChart.js
=================

A SVG doughnut chart with animation and tooltip.
Inspired by Chart.js(http://www.chartjs.org/).

[Demo on my codepen](http://codepen.io/githiro/details/ICfFE)

Licensed under the MIT License.
# jquery.drawDoughnutChart.js

A SVG doughnut chart with animation and tooltip.
Inspired by Chart.js(http://www.chartjs.org/).
[Demo on my codepen](http://codepen.io/githiro/details/ICfFE)

## Usage

EXAMPLE:
```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>jquery.drawDoughnutChart.js</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
	<div id="doughnutChart" class="chart"></div>
	<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
	<script src="../jquery.drawDoughnutChart.js"></script>
	<script>
$(function(){
  $("#doughnutChart").drawDoughnutChart([
    { title: "A.",                                            value : "100mm",  color: "#2C3E50" },
    { title: "B. B's value: $0.",                             value:  "80mm",   color: "#FC4349" },
    { title: "C.A's value: $1, B's value: $2, C's value: $0", value:  "70mm",   color: "#6DBCDB" },
    { title: "D. C's value: $3.",                             value : "50mm",   color: "#F7E248" },
    { title: "E. D's value: $4.",                             value : "40mm",   color: "#D7DADB" },
    { title: "F. F's value: $0",                              value : "20mm",   color: "#FFF" }
  ]);
});
	</script>
</body>
</html>
```
RESULT:
- A's title: "A."
- B's title: "B. B's value: 80mm."
- C's title: "C.A's value: 100mm, B's value: 80mm, C's value: 70mm"
- ......
- F's title: "F. F's value: 20mm"

## API reference


### title

*title* is the content of tip that showed when mouse enter. It can be a:
- plain string
- string containing patterns $1, $2, etc, among which $1 refers to the property of value in the 1st element of the array.
- string containing patterns $0 which refers to the property of value in the same element of the array.

### value

*value*  depends the area of the segment. It can be a:
- number
- string that start with a number followed by any character. The number depends the area

### color

*color* is the color of the segment of the ring.

## License
Licensed under the MIT license.