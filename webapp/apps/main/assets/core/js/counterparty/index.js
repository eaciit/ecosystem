var counterpary = {}
counterpary.datadetailgraph = ko.observableArray([])

counterpary.meglobal = [{
    "value": "ASA",
    "text": "ASA"
}, {
    "value": "AME",
    "text": "AME"
}]
counterpary.buyer = [{
    "value": 1,
    "text": "Ibrahim Fibres"
}, {
    "value": 2,
    "text": "Reliance Ind"
}]
counterpary.group = [{
    "value": "ETB",
    "text": "ETB"
}, {
    "value": "NTB",
    "text": "NTB"
}]
counterpary.top = [{
    "value": 5,
    "text": "Top 5"
}, {
    "value": 3,
    "text": "Top 3"
}]
counterpary.flows = [{
    "value": 31,
    "text": "Flows>$30M"
}, {
    "value": 100,
    "text": "Flows>$100M"
}]


counterpary.generateGraph = function() {
 var data = {
  "DOW CHEMICAL INTERNATIONAL PRIVATE LIMITED": [
  {
    cpty_long_name: "DowChemical InternationalPvt. Ltd.",
    cpty_bank: "CITI",
    cpty_coi: "IN",
    cust_bank: "SCBL",
    cust_role: "BUYER",
    total: "100000000"
  },{
    cpty_long_name: "ASIAN PAINTS SUPPLIER PAYMENTS A C",
    cpty_bank: "HDFC",
    cpty_coi: "IN",
    cust_bank: "SCBL",
    cust_role: "BUYER",
    total: "10000000"
  },{
    cpty_long_name: "AKZO NOBEL INDIA LIMITED",
    cpty_bank: "CITI",
    cpty_coi: "IN",
    cust_bank: "SCBL",
    cust_role: "PAYEE",
    total: "80000000"
  },{
    cpty_long_name: "KANSAI NEROLAC PAINT INDIA PRIVATE LIMITED",
    cpty_bank: "DEUT",
    cpty_coi: "IN",
    cust_bank: "SCBL",
    cust_role: "PAYEE",
    total: "80000000"
  },{
    cpty_long_name: "NIPPON PAINT INDIA PRIVATE LIMITED",
    cpty_bank: "UTIB",
    cpty_coi: "IN",
    cust_bank: "SCBL",
    cust_role: "PAYEE",
    total: "80000000"
  }]
}

console.log(data);
  
var links = [{
    source: "Apple",
    target: "Microsoft",
    type: "opportunity",
    text: "opportunity"
  },
  {
    source: "Microsoft",
    target: "Apple",
    type: "opportunity",
    text: ""
  },
  {
    source: "Samsung",
    target: "Apple",
    type: "opportunity",
    text: ""
  },
  {
    source: "Apple",
    target: "Samsung",
    type: "opportunity",
    text: "opportunity"
  },
  {
    source: "Microsoft",
    target: "Apple",
    type: "flow",
    text: ""
  },
  {
    source: "Samsung",
    target: "Apple",
    type: "missed",
    text: "missed flow"
  },
   {
    source: "Micrsssosoft",
    target: "Apple",
    type: "flow",
    text: ""
  },
   {
    source: "Misscrosoft",
    target: "Apple",
    type: "flow",
    text: ""
  },
   {
    source: "Micrssosoft",
    target: "Apple",
    type: "flow",
    text: ""
  },
  {
    source: "Samreresung",
    target: "Apple",
    type: "missed",
    text: "missed flow"
  },
  {
    source: "Saeregmsung",
    target: "Apple",
    type: "missed",
    text: "missed flow"
  },
  {
    source: "Samsrgrtrtung",
    target: "Apple",
    type: "missed",
    text: "missed flow"
  },
  {
    source: "Srtrtrtamsung",
    target: "Apple",
    type: "missed",
    text: "missed flow"
  },
  {
    source: "Samsrtrtrtung",
    target: "Apple",
    type: "flow",
    text: ""
  },
  {
    source: "Samsdwqddferrung",
    target: "Apple",
    type: "missed",
    text: "missed flow"
  },
  {
    source: "Samssdsdsfrgrgung",
    target: "Apple",
    type: "missed",
    text: "missed flow"
  },
   {
    source: "Samsdfdfsfrgrgung",
    target: "Apple",
    type: "missed",
    text: "missed flow"
  },
   {
    source: "Samsffefdgrgrgrgung",
    target: "Apple",
    type: "missed",
    text: "missed flow"
  },
   {
    source: "Samsfrgghhyugrgung",
    target: "Apple",
    type: "missed",
    text: "missed flow"
  },
   {
    source: "Samsfrguytuit7krgung",
    target: "Apple",
    type: "missed",
    text: "missed flow"
  },
   {
    source: "Samsfrgkutkrgung",
    target: "Apple",
    type: "missed",
    text: "missed flow"
  },
];
//sort links by source, then target
links.sort(function (a, b) {
  if (a.source > b.source) {
    return 1;
  } else if (a.source < b.source) {
    return -1;
  } else {
    if (a.target > b.target) {
      return 1;
    }
    if (a.target < b.target) {
      return -1;
    } else {
      return 0;
    }
  }
});

var nodes = {};

// Compute the distinct nodes from the links.
links.forEach(function (link) {
  link.source = nodes[link.source] || (nodes[link.source] = {
    name: link.source
  });
  link.target = nodes[link.target] || (nodes[link.target] = {
    name: link.target
  });
});

var w = 600,
  h = 600;

var force = d3.layout.force()
  .nodes(d3.values(nodes))
  .links(links)
  .size([w, h])
  .linkDistance(200)
  .charge(-500)
  .on("tick", tick)
  .start();

var svg = d3.select("#graph").append("svg:svg")
  .attr("width", w)
  .attr("height", h);

// Per-type markers, as they don't inherit styles.
svg.append("svg:defs").selectAll("marker")
  .data(["flow", "missed"])
  .enter().append("svg:marker")
  .attr("id", String)
  .attr("viewBox", "0 -5 10 10")
  .attr("refX", 20)
  .attr("refY", -1.5)
  .attr("markerWidth", 6)
  .attr("markerHeight", 6)
  .attr("orient", "auto")
  .append("svg:path")
  .attr("d", "M0,-5L10,0L0,5");

var path = svg.append("svg:g").selectAll("path")
  .data(force.links())
  .enter().append("svg:path")
  .attr("id", function (d, i) {
    return "linkId_" + i;
  })
  .attr("class", function (d) {
    return "link " + d.type;
  })
  .attr("marker-end", function (d) {
    return "url(#" + d.type + ")";
  });

var pathText = svg.selectAll(".pathText")
  .data(force.links())
  .enter().append("svg:text")
  .attr("class", "pathText")
  .attr("dx", 75)
  .attr("dy", -3)
  .style("fill", "red")
  .append("textPath")
  .attr("xlink:href", function (d, i) {
    return "#linkId_" + i;
  })
  .text(function (d, i) {
    return d.text
  });

var circle = svg.append("svg:g").selectAll("circle")
  .data(force.nodes())
  .enter().append("svg:circle")
  .on("click", collapse)
  .attr("r", 10)
  .call(force.drag);

var text = svg.append("svg:g").selectAll("g")
  .data(force.nodes())
  .enter().append("svg:g");

// A copy of the text with a thick white stroke for legibility.
text.append("svg:text")
  .attr("x", 14)
  .attr("y", ".31em")
  .attr("class", "shadow")
  .text(function (d) {
    return d.name;
  });

text.append("svg:text")
  .attr("x", 14)
  .attr("y", ".31em")
  .text(function (d) {
    return d.name;
  });

// Use elliptical arc path segments to doubly-encode directionality.
function tick() {
  path.attr("d", function (d) {
    var dx = d.target.x - d.source.x,
      dy = d.target.y - d.source.y,
      dr = d.type == "opportunity" ? 200 : 400;
    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
  });

  circle.attr("transform", function (d) {
    return "translate(" + d.x + "," + d.y + ")";
  });

  text.attr("transform", function (d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
}

  var status = 0
function collapse(d) {
   if (!d3.event.defaultPrevented) {
      //console.log(d);
      //var list1 = d3.selectAll(".mYc").filter(".a101");
      var slc = d.name;
     if (status == 0){
       d3.selectAll("circle").transition().duration(500)
        .style("visibility", function(o) {
        return o.name === slc  ? 1 : "hidden";
        });
        status = 1;
        d3.selectAll("path").transition().duration(500)
        .style("visibility", "hidden")
     
       d3.selectAll("path").transition().duration(500)
        .style("visibility", "hidden")
     
       d3.selectAll("text").transition().duration(500)
        .style("visibility", "hidden")
      }
      else if(status == 1){
         d3.selectAll("circle").transition().duration(500)
        .style("visibility", function(o) {
        return o.name === slc  ? 1 : "visible";
        });
        status = 0;
         d3.selectAll("path").transition().duration(500)
        .style("visibility", "visible")
     
       d3.selectAll("path").transition().duration(500)
        .style("visibility", "visible")
     
       d3.selectAll("text").transition().duration(500)
        .style("visibility", "visible")

      }
           
       // alert(slc);
      }///end event
}
    // $('#month').data('kendoDatePicker').enable(false);

    // $('#radioBtn a').on('click', function() {
    //     var sel = $(this).data('title');
    //     var tog = $(this).data('toggle');
    //     $('#' + tog).prop('value', sel);
    //     if (sel == "M") {
    //         $('#year').data('kendoDatePicker').enable(false);
    //         $('#month').data('kendoDatePicker').enable(true);
    //     } else if (sel == "Y") {
    //         $('#year').data('kendoDatePicker').enable(true);
    //         $('#month').data('kendoDatePicker').enable(false);
    //     }

    //     $('a[data-toggle="' + tog + '"]').not('[data-title="' + sel + '"]').removeClass('active').addClass('notActive');
    //     $('a[data-toggle="' + tog + '"][data-title="' + sel + '"]').removeClass('notActive').addClass('active');
    // })

    // var dgraph = [{
    //         "id": 1,
    //         "bottom": 170,
    //         "left": 40,
    //         "transform": -40,
    //         "bbottom": 76,
    //         "bleft": 20,
    //         "linklabel": "UTI Bank $107M",
    //         "nodelabel": "Relliance Ind",
    //         "nodelabel2": "IN",
    //         listdetail: [{
    //             "bank": "FIBB",
    //             "product": "TRADE",
    //             "flow": 8.44,
    //             "not": 2
    //         }, {
    //             "bank": "HBKS",
    //             "product": "TRADE",
    //             "flow": 3.40,
    //             "not": 1
    //         }, {
    //             "bank": "HCEB",
    //             "product": "TRADE",
    //             "flow": 8.95,
    //             "not": 2
    //         }]
    //     },
    //     {
    //         "id": 2,
    //         "bottom": 300,
    //         "left": 20,
    //         "transform": 21,
    //         "bbottom": 331,
    //         "bleft": -7,
    //         "linklabel": "Various Banks $121M SCB",
    //         "nodelabel": "Ibrahim Fibres",
    //         "nodelabel2": "Pak",
    //         listdetail: [{
    //             "bank": "FIBB",
    //             "product": "TRADE",
    //             "flow": 8.44,
    //             "not": 2
    //         }, {
    //             "bank": "HBKS",
    //             "product": "TRADE",
    //             "flow": 3.40,
    //             "not": 1
    //         }, {
    //             "bank": "HCEB",
    //             "product": "TRADE",
    //             "flow": 8.95,
    //             "not": 2
    //         }, {
    //             "bank": "MCBK",
    //             "product": "TRADE",
    //             "flow": 9.27,
    //             "not": 2
    //         }, {
    //             "bank": "MEEB",
    //             "product": "TRADE",
    //             "flow": 3.98,
    //             "not": 2
    //         }, {
    //             "bank": "SCBL",
    //             "product": "TRADE",
    //             "flow": 2.0,
    //             "not": 1
    //         }, {
    //             "bank": "UNIL",
    //             "product": "TRADE",
    //             "flow": 13.18,
    //             "not": 2
    //         }]
    //     },
    //     {
    //         "id": 3,
    //         "bottom": 380,
    //         "left": 160,
    //         "transform": -90,
    //         "bbottom": 490,
    //         "bleft": 240,
    //         "linklabel": "$154M SBI",
    //         "nodelabel": "Bhilosha Ind",
    //         "nodelabel2": "Ind",
    //         listdetail: [{
    //             "bank": "FIBB",
    //             "product": "TRADE",
    //             "flow": 8.44,
    //             "not": 2
    //         }, {
    //             "bank": "HBKS",
    //             "product": "TRADE",
    //             "flow": 3.40,
    //             "not": 1
    //         }, {
    //             "bank": "HCEB",
    //             "product": "TRADE",
    //             "flow": 8.95,
    //             "not": 2
    //         }]
    //     },
    //     {
    //         "id": 4,
    //         "bottom": 360,
    //         "left": 290,
    //         "transform": -50,
    //         "bbottom": 450,
    //         "bleft": 450,
    //         "linklabel": "$94M UBL",
    //         "nodelabel": "ICI Pakistan",
    //         "nodelabel2": "Pak",
    //         listdetail: [{
    //             "bank": "FIBB",
    //             "product": "TRADE",
    //             "flow": 8.44,
    //             "not": 2
    //         }, {
    //             "bank": "HBKS",
    //             "product": "TRADE",
    //             "flow": 3.40,
    //             "not": 1
    //         }]
    //     },
    //     {
    //         "id": 5,
    //         "bottom": 200,
    //         "left": 310,
    //         "transform": 16,
    //         "bbottom": 160,
    //         "bleft": 510,
    //         "linklabel": "$5M",
    //         "nodelabel": "PWC",
    //         "nodelabel2": "UK",
    //         listdetail: [{
    //             "bank": "FIBB",
    //             "product": "TRADE",
    //             "flow": 8.44,
    //             "not": 2
    //         }, {
    //             "bank": "HBKS",
    //             "product": "TRADE",
    //             "flow": 3.40,
    //             "not": 1
    //         }, {
    //             "bank": "HCEB",
    //             "product": "TRADE",
    //             "flow": 8.95,
    //             "not": 2
    //         }]
    //     }
    // ]

    // for (var key in dgraph) {
    //     if (key > 1 && dgraph[key].nodelabel != "PWC") {
    //         var aleft = '<i class="fa fa-caret-left arrowleft" aria-hidden="true"></i>'
    //     } else {
    //         var aleft = '<i class="fa fa-caret-right arrowright" aria-hidden="true"></i>'
    //     }
    //     var mynode = '<div align="center" id="jo' + key + '"class="titletext">' +
    //         '<div style="position: relative" ><span id="linklabel' + key + '"></span>' +
    //         '<div class="titletextafter"></div>' +
    //         '<div class="linkdashed" style=""></div>' +
    //         '</div>' +
    //         '' + aleft + '' +
    //         '</div>' +
    //         '<div class="newtitle" id="bubble' + key + '" >' +
    //         '<div class="afternewtitle" ><span rel=' + dgraph[key].id + ' id="nodelabel' + key + '"></span></div>' +
    //         '</div>'

    //     $("#showing").append(mynode);
    //     $("#jo" + key + "").css({

    //         'bottom': dgraph[key].bottom + 'px',
    //         'left': dgraph[key].left + 'px',
    //         'transform': 'rotate(' + dgraph[key].transform + 'deg)',

    //     });
    //     $("#bubble" + key + "").css({
    //         'bottom': dgraph[key].bbottom + 'px',
    //         'left': dgraph[key].bleft + 'px',
    //     });
    //     if (dgraph[key].nodelabel == "PWC") {

    //         $("#bubble" + key + "").css({
    //             "background-color": "#00bcd4"
    //         });
    //         $("#jo" + key + "").find(".linkdashed").css({
    //             "border": "0px"
    //         });

    //         $("#jo" + key + "").css({
    //             "border": "0px",
    //             "background-color": "#fff"
    //         })
    //     }
    //     $("#linklabel" + key + "").text(dgraph[key].linklabel);
    //     $("#nodelabel" + key + "").html(dgraph[key].nodelabel + "<br>" + dgraph[key].nodelabel2);
    // }


    // $(".afternewtitle").click(function() {

    //     var bubbletitle = $(this).find("span").attr("rel")

    //     var data = _.find(dgraph, function(d) {
    //         return d.id == bubbletitle
    //     })


    //     console.log(data["nodelabel"])
    //     counterpary.datadetailgraph(data.listdetail)

    //     var arr = bubbletitle.split('<br>')
    //     var arr1 = arr[0]
    //     var arr2 = arr[1]
    //     $(".modal-title").html(data["nodelabel"])
    //     $('#Modal').modal('show')



    // });



}



$(window).load(function() {
    counterpary.generateGraph()
})