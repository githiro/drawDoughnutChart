/*!
 * jquery.drawDoughnutChart.js
 * Version: 0.4(Beta)
 * Inspired by Chart.js(http://www.chartjs.org/)
 *
 * Copyright 2014 hiro
 * https://github.com/githiro/drawDoughnutChart
 * Released under the MIT license.
 *
 */
drawDoughnutChart = function(data, options, parentElement, width, height) {
  if (height === undefined)
    height = width;
  var $this = document.createElement('div');
  $this.style.width = width + 'px';
  $this.style.height = (height||width) + 'px';
  $this.className = 'chart';
  parentElement.appendChild($this);

  var W = width,
    H = height,
    centerX = W / 2,
    centerY = H / 2,
    cos = Math.cos,
    sin = Math.sin,
    PI = Math.PI,
    settings = {
      segmentShowStroke: true,
      segmentStrokeColor: "#0C1013",
      segmentStrokeWidth: 1,
      baseColor: "rgba(0,0,0,0.5)",
      baseOffset: 4,
      edgeOffset: 10, //offset from edge of $this
      percentageInnerCutout: 75,
      animation: true,
      animationSteps: 90,
      animationEasing: "easeInOutExpo",
      animateRotate: true,
      tipOffsetX: 0,
      tipOffsetY: -45,
      showTip: true,
      showLongTip: false,
      showLabel: false,
      ratioFont: 1.5,
      shortInt: false,
      tipClass: "doughnutTip",
      summaryClass: "doughnutSummary",
      summaryTitle: "TOTAL:",
      summaryTitleClass: "doughnutSummaryTitle",
      summaryNumberClass: "doughnutSummaryNumber",
      beforeDraw: function() {},
      afterDrawed: function() {},
      onPathEnter: function(e, data) {},
      onPathLeave: function(e, data) {}
    },
    animationOptions = {
      linear: function(t) {
        return t;
      },
      easeInOutExpo: function(t) {
        var v = t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
        return (v > 1) ? 1 : v;
      }
    },
    requestAnimFrame = function() {
      return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
    }();
  for (var key in options) {
    settings[key] = options[key];
  }

  settings.beforeDraw.call($this);

  var $svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  $svg.setAttribute("width", W);
  $svg.setAttribute("height", H);
  $svg.setAttribute("viewBox", '0 0 ' + W + ' ' + H);
  $svg.setAttribute("xmlns:xlink", 'http://www.w3.org/1999/xlink');
  $this.appendChild($svg);
  var $paths = [],
    easingFunction = animationOptions[settings.animationEasing],
    doughnutRadius = Min([H / 2, W / 2]) - settings.edgeOffset,
    cutoutRadius = doughnutRadius * (settings.percentageInnerCutout / 100),
    segmentTotal = 0;

  //Draw base doughnut
  var baseDoughnutRadius = doughnutRadius + settings.baseOffset,
    baseCutoutRadius = cutoutRadius - settings.baseOffset;
  var tmpath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  tmpath.setAttribute("d", getHollowCirclePath(baseDoughnutRadius, baseCutoutRadius));
  tmpath.setAttribute("fill", settings.baseColor);
  $svg.appendChild(tmpath);

  //Set up pie segments wrapper
  var $pathGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  $pathGroup.setAttribute('opacity', 0);
  $svg.appendChild($pathGroup);

  //Set up tooltip with arbitrary string
  if (settings.showLongTip) {
    settings.showTip = false;
    var $tip = document.createElement('div');
    $tip.setAttribute('class', settings.tipClass);
    $tip.style.opacity = 0;
    document.getElementsByTagName('body')[0].appendChild($tip);

    var tipW = parseInt($tip.clientWidth),
      tipH = parseInt($tip.clientHeight);
  }
  //Set up tooltip
  if (settings.showTip) {
    var $tip = document.createElement('div');
    $tip.setAttribute('class', settings.tipClass);
    $tip.style.opacity = 0;
    document.getElementsByTagName('body')[0].appendChild($tip);

    var tipW = parseInt($tip.clientWidth),
      tipH = parseInt($tip.clientHeight);
  }

  //Set up center text area
  var summarySize = (cutoutRadius - (doughnutRadius - cutoutRadius)) * 2;
  var $summary = document.createElement('div');
  $summary.setAttribute('class', settings.summaryClass);
  $summary.style.width = summarySize + 'px';
  $summary.style.height = summarySize + 'px';
  $summary.style.marginLeft = (summarySize / 2) + settings.edgeOffset + 'px';
  $summary.style.marginTop = -(summarySize / 2) - (height / 2) + settings.edgeOffset + 'px';
  $this.appendChild($summary);

  var $summaryTitle = document.createElement('p');
  $summaryTitle.setAttribute('class', settings.summaryTitleClass);
  var textnode = document.createTextNode(settings.summaryTitle);
  $summaryTitle.appendChild(textnode);
  $summaryTitle.style.fontSize = getScaleFontSize($summaryTitle, settings.summaryTitle);
  $summary.appendChild($summaryTitle);

  var $summaryNumber = document.createElement('p');
  $summaryNumber.setAttribute('class', settings.summaryNumberClass);
  $summaryNumber.style.opacity = 0;
  $summary.appendChild($summaryNumber);

  for (var i = 0, len = data.length; i < len; i++) {
    segmentTotal += data[i].value;
    $paths[i] = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    $paths[i].setAttribute('stroke-width', settings.segmentStrokeWidth);
    $paths[i].setAttribute('stroke', settings.segmentStrokeColor);
    $paths[i].setAttribute('fill', data[i].color);
    $paths[i].setAttribute('data-order', i);
    $paths[i].addEventListener("mouseenter", pathMouseEnter);
    $paths[i].addEventListener("mouseleave", pathMouseLeave);
    $paths[i].addEventListener("mousemove", pathMouseMove);
    $paths[i].addEventListener("click", pathClick);
    $pathGroup.appendChild($paths[i]);
  }

  //Animation start
  animationLoop(drawPieSegments);

  //Functions
  function getHollowCirclePath(doughnutRadius, cutoutRadius) {
    //Calculate values for the path.
    //We needn't calculate startRadius, segmentAngle and endRadius, because base doughnut doesn't animate.
    var startRadius = -1.570, // -Math.PI/2
      segmentAngle = 6.2831, // 1 * ((99.9999/100) * (PI*2)),
      endRadius = 4.7131, // startRadius + segmentAngle
      startX = centerX + cos(startRadius) * doughnutRadius,
      startY = centerY + sin(startRadius) * doughnutRadius,
      endX2 = centerX + cos(startRadius) * cutoutRadius,
      endY2 = centerY + sin(startRadius) * cutoutRadius,
      endX = centerX + cos(endRadius) * doughnutRadius,
      endY = centerY + sin(endRadius) * doughnutRadius,
      startX2 = centerX + cos(endRadius) * cutoutRadius,
      startY2 = centerY + sin(endRadius) * cutoutRadius;
    var cmd = [
      'M', startX, startY,
      'A', doughnutRadius, doughnutRadius, 0, 1, 1, endX, endY, //Draw outer circle
      'Z', //Close path
      'M', startX2, startY2, //Move pointer
      'A', cutoutRadius, cutoutRadius, 0, 1, 0, endX2, endY2, //Draw inner circle
      'Z'
    ];
    cmd = cmd.join(' ');
    return cmd;
  }

  function pathMouseEnter(e) {
    var order = parseInt(this.attributes['data-order'].value);
    if (settings.showLongTip) {
      $tip.textContent = data[order].tip;
      //$tip.textContent.className = 'show';
      $tip.style.opacity = 1;
    }
    if (settings.showTip) {
      $tip.textContent = data[order].title + ": " + data[order].value;
      //$tip.textContent.className = 'show';
      $tip.style.opacity = 1;
    }
    if (settings.showLabel) {
      $summaryTitle.textContent = data[order].title;
      $summaryTitle.style.fontSize = getScaleFontSize($summaryTitle, data[order].title);
      var tmpNumber = settings.shortInt ? shortKInt(data[order].value) : data[order].value;
      $summaryNumber.innerHTML = tmpNumber;
      $summaryNumber.style.fontSize = getScaleFontSize($summaryNumber, tmpNumber);
    }
    settings.onPathEnter.apply(this, [e, data]);
  }

  function pathMouseLeave(e) {
    if (settings.showTip || settings.showLongTip) $tip.style.opacity = 0;
    if (settings.showLabel) {
      $summaryTitle.textContent = settings.summaryTitle;
      $summaryTitle.style.fontSize = getScaleFontSize($summaryTitle, settings.summaryTitle);
      var tmpNumber = settings.shortInt ? shortKInt(segmentTotal) : segmentTotal;
      $summaryNumber.innerHTML = tmpNumber;
      $summaryNumber.style.fontSize = getScaleFontSize($summaryNumber, tmpNumber);
    }
    settings.onPathLeave.apply(this, [e, data]); //todo
  }

  function pathMouseMove(e) {
    if (settings.showTip || settings.showLongTip) {
      $tip.style.top = e.pageY + settings.tipOffsetY + 'px';
      $tip.style.left = e.pageX - parseInt($tip.clientWidth) / 2 + settings.tipOffsetX + 'px';
    }
  }

  function pathClick(e) {
    var order = parseInt(this.attributes['data-order'].value);
    if (typeof data[order].action != "undefined")
      data[order].action();
  }

  function drawPieSegments(animationDecimal) {
    var startRadius = -PI / 2, //-90 degree
      rotateAnimation = 1;
    if (settings.animation && settings.animateRotate) rotateAnimation = animationDecimal; //count up between0~1

    drawDoughnutText(animationDecimal, segmentTotal);

    $pathGroup.setAttribute("opacity", animationDecimal);

    //If data have only one value, we draw hollow circle(#1).
    if (data.length === 1 && (4.7122 < (rotateAnimation * ((data[0].value / segmentTotal) * (PI * 2)) + startRadius))) {
      $paths[0].setAttribute("d", getHollowCirclePath(doughnutRadius, cutoutRadius));
      return;
    }
    for (var i = 0, len = data.length; i < len; i++) {
      var segmentAngle = rotateAnimation * ((data[i].value / segmentTotal) * (PI * 2)),
        endRadius = startRadius + segmentAngle,
        largeArc = ((endRadius - startRadius) % (PI * 2)) > PI ? 1 : 0,
        startX = centerX + cos(startRadius) * doughnutRadius,
        startY = centerY + sin(startRadius) * doughnutRadius,
        endX2 = centerX + cos(startRadius) * cutoutRadius,
        endY2 = centerY + sin(startRadius) * cutoutRadius,
        endX = centerX + cos(endRadius) * doughnutRadius,
        endY = centerY + sin(endRadius) * doughnutRadius,
        startX2 = centerX + cos(endRadius) * cutoutRadius,
        startY2 = centerY + sin(endRadius) * cutoutRadius;
      var cmd = [
        'M', startX, startY, //Move pointer
        'A', doughnutRadius, doughnutRadius, 0, largeArc, 1, endX, endY, //Draw outer arc path
        'L', startX2, startY2, //Draw line path(this line connects outer and innner arc paths)
        'A', cutoutRadius, cutoutRadius, 0, largeArc, 0, endX2, endY2, //Draw inner arc path
        'Z' //Cloth path
      ];
      $paths[i].setAttribute("d", cmd.join(' '));
      startRadius += segmentAngle;
    }
  }

  function drawDoughnutText(animationDecimal, segmentTotal) {
    segmentTotal = Math.ceil(animationDecimal * segmentTotal);
    $summaryNumber.style.opacity = animationDecimal;
    $summaryNumber.textContent = (segmentTotal * animationDecimal).toFixed(1);
    var tmpNumber = settings.shortInt ? shortKInt(segmentTotal) : segmentTotal;
    $summaryNumber.innerHTML = tmpNumber;
    $summaryNumber.style.fontSize = getScaleFontSize($summaryNumber, tmpNumber);
  }

  function animateFrame(cnt, drawData) {
    var easeAdjustedAnimationPercent = (settings.animation) ? CapValue(easingFunction(cnt), null, 0) : 1;
    drawData(easeAdjustedAnimationPercent);
  }

  function animationLoop(drawData) {
    var animFrameAmount = (settings.animation) ? 1 / CapValue(settings.animationSteps, Number.MAX_VALUE, 1) : 1,
      cnt = (settings.animation) ? 0 : 1;
    requestAnimFrame(function() {
      cnt += animFrameAmount;
      animateFrame(cnt, drawData);
      if (cnt <= 1) {
        requestAnimFrame(arguments.callee);
      } else {
        settings.afterDrawed.call($this); //todo
      }
    });
  }

  function Max(arr) {
    return Math.max.apply(null, arr);
  }

  function Min(arr) {
    return Math.min.apply(null, arr);
  }

  function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  function CapValue(valueToCap, maxValue, minValue) {
    if (isNumber(maxValue) && valueToCap > maxValue) return maxValue;
    if (isNumber(minValue) && valueToCap < minValue) return minValue;
    return valueToCap;
  }

  function shortKInt(int) {
    int = int.toString();
    var strlen = int.length;
    if (strlen < 5)
      return int;
    if (strlen < 8)
      return '<span title="' + int + '">' + int.substring(0, strlen - 3) + 'K</span>';
    return '<span title="' + int + '">' + int.substring(0, strlen - 6) + 'M</span>';
  }

  function getScaleFontSize(block, newText) {
    block.style.fontSize = '0px';
    newText = newText.toString().replace(/(<([^>]+)>)/ig, "");
    var newFontSize = parseInt(block.clientWidth) / newText.length * settings.ratioFont;
    // Not very good : http://stephensite.net/WordPressSS/2008/02/19/how-to-calculate-the-character-width-accross-fonts-and-points/
    // But best quick way the 1.5 number is to affinate in function of the police
    var maxCharForDefaultFont = parseInt(block.clientWidth) - newText.length * parseInt(block.style.fontSize) / settings.ratioFont;
    if (maxCharForDefaultFont < 0)
      return newFontSize + 'px';
    else
      return '';
  }
  return $this;
};
