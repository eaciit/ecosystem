var dashboard = {}
dashboard.entities = ko.observableArray([])
dashboard.activeEntity = ko.observable()

var widget = {}

// Dummy Data 
dashboard.entities([{
  name: "Unilever ID",
  location: [-6.1751, 106.8650],
  value: 4
}])

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
    center: [18.062312304546726, 108.28125],
    zoom: 3,
    layers: [{
      type: "shape",
      dataSource: {
        data: template.features,
      },
      style: {
        fill: {
          opacity: 0.5
        }
      }
    }, {
      type: "bubble",
      style: {
        fill: {
          color: "#3A539B",
          opacity: 0.4
        },
        stroke: {
          width: 0
        }
      },
      dataSource: {
        data: dashboard.entities()
      },
      locationField: "location",
      valueField: "value"
    }],
    shapeCreated: onShapeCreated,
    shapeClick: onClickShape,
    shapeMouseEnter: onShapeMouseEnter,
    shapeMouseLeave: onShapeMouseLeave
  });

  $("#map").unbind("mousewheel")
  $("#map").unbind("DOMMouseScroll")

  function onShapeCreated(e) {

  }

  function onClickShape(e) {
    dashboard.showMapDetails()
    dashboard.activeEntity(e.shape.dataItem)
    $("#mapDetailModal").modal("show")
  }

  var activeShape

  function onShapeMouseEnter(e) {
    e.shape.options.fill.set("opacity", 0.7)
    e.shape.options.stroke.set("width", 1)
    activeShape = e.shape
    $("#map").css("cursor", "pointer")
  }

  function onShapeMouseLeave(e) {
    e.shape.options.set("fill.opacity", 0.4)
    e.shape.options.stroke.set("width", 0)
    $("#map").css("cursor", "inherit")
  }

}

dashboard.showMapDetails = function() {

}

$(window).load(function () {
  widget.generateCharts()

  dashboard.generateMap()
})