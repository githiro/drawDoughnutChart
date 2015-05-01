/*!
 * jquery.drawDoughnutChart.js
 * Version: 0.3(Beta)
 * Inspired by Chart.js(http://www.chartjs.org/)
 *
 * Copyright 2013 hiro
 * https://github.com/githiro/drawDoughnutChart
 * Released under the MIT license.
 *
 */
!function( factory ) {
    if ( typeof define === "function" && define.amd ) {

        // AMD. Register as an anonymous module.
        define([ "jquery" ], factory );
    }
    else if(typeof module === "object" && typeof module.exports === "object" ) {
        module.exports = factory(jQuery);
    }
    else {

        // Browser globals
        factory( jQuery );
    }
}(function($){
    (function($, undefined) {
        $.fn.drawDoughnutChart = function(data, options) {
            var $this = this,
                W = $this.width(),
                H = $this.height(),
                centerX = W/2,
                centerY = H/2,
                cos = Math.cos,
                sin = Math.sin,
                PI = Math.PI,
                settings = $.extend({
                    segmentShowStroke : true,
                    segmentStrokeColor : "#0C1013",
                    segmentStrokeWidth : 1,
                    baseColor: "rgba(0,0,0,0.5)",
                    baseOffset: 4,
                    edgeOffset : 10,//offset from edge of $this
                    percentageInnerCutout : 75,
                    animation : true,
                    animationSteps : 90,
                    animationEasing : "easeInOutExpo",
                    animateRotate : true,
                    tipOffsetX: -8,
                    tipOffsetY: -45,
                    tipClass: "doughnutTip",
                    summaryClass: "doughnutSummary",
                    summaryTitle: "",
                    summaryTitleClass: "doughnutSummaryTitle",
                    summaryNumberClass: "doughnutSummaryNumber",
                    beforeDraw: function() {  },
                    afterDrawed : function() {  },
                    onPathEnter : function(e,data) {  },
                    onPathLeave : function(e,data) {  }
                }, options),
                animationOptions = {
                    linear : function (t) {
                        return t;
                    },
                    easeInOutExpo: function (t) {
                        var v = t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t;
                        return (v>1) ? 1 : v;
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

            settings.beforeDraw.call($this);

            var $svg = $('<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"></svg>').appendTo($this),
                $paths = [],
                easingFunction = animationOptions[settings.animationEasing],
                doughnutRadius = Min([H / 2,W / 2]) - settings.edgeOffset,
                cutoutRadius = doughnutRadius * (settings.percentageInnerCutout / 100),
                segmentTotal = 0,
                value = data.map(function(elem) {  // extract the numerical part of the string of data[i].value
                    return parseFloat(elem.value) || 0;
                });

            //Draw base doughnut
            var baseDoughnutRadius = doughnutRadius + settings.baseOffset,
                baseCutoutRadius = cutoutRadius - settings.baseOffset;
            var drawBaseDoughnut = function() {
                //Calculate values for the path.
                //We needn't calculate startRadius, segmentAngle and endRadius, because base doughnut doesn't animate.
                var startRadius = -1.570,// -Math.PI/2
                    segmentAngle = 6.2831,// 1 * ((99.9999/100) * (PI*2)),
                    endRadius = 4.7131,// startRadius + segmentAngle
                    startX = centerX + cos(startRadius) * baseDoughnutRadius,
                    startY = centerY + sin(startRadius) * baseDoughnutRadius,
                    endX2 = centerX + cos(startRadius) * baseCutoutRadius,
                    endY2 = centerY + sin(startRadius) * baseCutoutRadius,
                    endX = centerX + cos(endRadius) * baseDoughnutRadius,
                    endY = centerY + sin(endRadius) * baseDoughnutRadius,
                    startX2 = centerX + cos(endRadius) * baseCutoutRadius,
                    startY2 = centerY + sin(endRadius) * baseCutoutRadius;
                var cmd = [
                    'M', startX, startY,
                    'A', baseDoughnutRadius, baseDoughnutRadius, 0, 1, 1, endX, endY,
                    'L', startX2, startY2,
                    'A', baseCutoutRadius, baseCutoutRadius, 0, 1, 0, endX2, endY2,//reverse
                    'Z'
                ];
                $(document.createElementNS('http://www.w3.org/2000/svg', 'path'))
                    .attr({
                        "d": cmd.join(' '),
                        "fill": settings.baseColor
                    })
                    .appendTo($svg);
            }();

            //Set up pie segments wrapper
            var $pathGroup = $(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
            $pathGroup.attr({opacity: 0}).appendTo($svg);

            //Set up tooltip
            var $tip = $('<div class="' + settings.tipClass + '" />').appendTo('body').hide(),
                tipW = $tip.width(),
                tipH = $tip.height();

            //Set up center text area
            var summarySize = (cutoutRadius - (doughnutRadius - cutoutRadius)) * 2,
                $summary = $('<div class="' + settings.summaryClass + '" />')
                    .appendTo($this)
                    .css({
                        width: summarySize + "px",
                        height: summarySize + "px",
                        "margin-left": -(summarySize / 2) + "px",
                        "margin-top": -(summarySize / 2) + "px"
                    });
            var $summaryTitle = $('<p class="' + settings.summaryTitleClass + '">' + settings.summaryTitle + '</p>').appendTo($summary);
            var $summaryNumber = $('<p class="' + settings.summaryNumberClass + '"></p>').appendTo($summary).css({opacity: 0});

            for (var i = 0, len = data.length; i < len; i++) {
                segmentTotal += value[i];
                $paths[i] = $(document.createElementNS('http://www.w3.org/2000/svg', 'path'))
                    .attr({
                        "stroke-width": settings.segmentStrokeWidth,
                        "stroke": settings.segmentStrokeColor,
                        "fill": data[i].color,
                        "data-order": i
                    })
                    .appendTo($pathGroup)
                    .on("mouseenter", pathMouseEnter)
                    .on("mouseleave", pathMouseLeave)
                    .on("mousemove", pathMouseMove);
            }
            segmentTotal = segmentTotal === 0 ? 1:segmentTotal;  // avoid denominator equaling to zero

            //Animation start
            animationLoop(drawPieSegments);

            function pathMouseEnter(e) {
                var order = $(this).data().order;
                $tip.text(data[order].title.replace(/\$(\d+)/g,function(match,$1){  // replace the pattern of $i in data[j].title with data[i-1].value, but when i equals zero, replace that with data[j].value
                    if($1 == 0) {
                        return data[order].value;
                    }
                    else if($1 > 0 && $1 <= data.length) {
                        return data[$1-1].value;
                    }
                    else return match;
                })).fadeIn(200);
                settings.onPathEnter.apply($(this),[e,data]);
            }
            function pathMouseLeave(e) {
                $tip.stop().hide();
                settings.onPathLeave.apply($(this),[e,data]);
            }
            function pathMouseMove(e) {
                $tip.css({
                    top: e.pageY + settings.tipOffsetY,
                    left: e.pageX - $tip.width() / 2 + settings.tipOffsetX
                });
            }
            function drawPieSegments (animationDecimal) {
                var startRadius = -PI / 2,//-90 degree
                    rotateAnimation = 1;
                if (settings.animation && settings.animateRotate) rotateAnimation = animationDecimal;//count up between0~1

                drawDoughnutText(animationDecimal, segmentTotal);

                $pathGroup.attr("opacity", animationDecimal);

                //draw each path
                for (var i = 0, len = data.length; i < len; i++) {
                    var segmentAngle = rotateAnimation * ((value[i] / segmentTotal) * (PI * 2)),
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
                        'M', startX, startY,//Move pointer
                        'A', doughnutRadius, doughnutRadius, 0, largeArc, 1, endX, endY,//Draw outer arc path
                        'L', startX2, startY2,//Draw line path(this line connects outer and innner arc paths)
                        'A', cutoutRadius, cutoutRadius, 0, largeArc, 0, endX2, endY2,//Draw inner arc path
                        'Z'//Cloth path
                    ];
                    $paths[i].attr("d", cmd.join(' '));
                    startRadius += segmentAngle;
                }
            }

            function drawDoughnutText(animationDecimal, segmentTotal) {
                $summaryNumber
                    .css({opacity: animationDecimal})
                    .text(); //text中参数(segmentTotal * animationDecimal).toFixed(1)
            }
            function animateFrame(cnt, drawData) {
                var easeAdjustedAnimationPercent =(settings.animation)? CapValue(easingFunction(cnt), null, 0) : 1;
                drawData(easeAdjustedAnimationPercent);
            }
            function animationLoop(drawData) {
                var animFrameAmount = (settings.animation)? 1 / CapValue(settings.animationSteps, Number.MAX_VALUE, 1) : 1,
                    cnt =(settings.animation)? 0 : 1;
                requestAnimFrame(function() {
                    cnt += animFrameAmount;
                    animateFrame(cnt, drawData);
                    if (cnt <= 1) {
                        requestAnimFrame(arguments.callee);
                    } else {
                        settings.afterDrawed.call($this);
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
            return $this;
        };
    })($);
});
