var dashboard = {}
var widget = {}

widget.buildChart = function (id, data) {
  $(id).kendoChart({
    title: {
      text: ""
    },
    chartArea: {
      background: ""
    },
    legend: {
      visible: false
    },
    series: [{
      type: "line",
      data: data,
      style: "smooth",
      markers: {
        visible: false
      }
    }],
    categoryAxis: {
      visible: false,
      majorGridLines: {
        visible: false
      }
    },
    valueAxis: {
      visible: false,
      majorGridLines: {
        visible: false
      }
    }
  })
}

widget.generateChart1 = function () {
  var data = [4, 1, 7, 2, 10]
  widget.buildChart("#widgetChart1", data)
}

widget.generateChart2 = function () {
  var data = [1, 5, 1, 2, 11]
  widget.buildChart("#widgetChart2", data)
}

widget.generateChart3 = function () {
  var data = [8, 7, 7, 9, 2]
  widget.buildChart("#widgetChart3", data)
}

widget.generateChart4 = function () {
  var data = [2, 9, 3, 6, 1]
  widget.buildChart("#widgetChart4", data)
}

widget.generateChart5 = function () {
  var data = [1, 1, 1, 2, 10]
  widget.buildChart("#widgetChart5", data)
}

widget.generateChart6 = function () {
  var data = [6, 1, 10, 1, 10]
  widget.buildChart("#widgetChart6", data)
}

widget.generateCharts = function () {
  widget.generateChart1()
  widget.generateChart2()
  widget.generateChart3()
  widget.generateChart4()
  widget.generateChart5()
  widget.generateChart6()
}

dashboard.generateMap = function () {
  var template = mapTemplate

  $("#map").kendoMap({
    controls: {
      navigator: false
    },
    layerDefaults: {
      marker: {
        tooltip: {
          autoHide: true,
          content: "Foo"
        }
      }
    },
    center: [18.062312304546726, 108.28125],
    zoom: 3,
    layers: [{
      type: "shape",
      dataSource: {
        data: template.features,
      },
      style: {
        fill: {
          opacity: 0.8
        }
      }
    }]
  });
}

$(window).load(function () {
  widget.generateCharts()

  dashboard.generateMap()
})