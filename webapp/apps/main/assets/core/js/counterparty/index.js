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
    var nodes = [{
        id: "Ibrahim Fibres",
        group: 2
    }, {
        id: "Bhilosha Ind",
        group: 2
    }, {
        id: "ICI Pakistan",
        group: 2
    }, {
        id: "Reliance Ind",
        group: 2
    }, {
        id: "MEGLOBAL INTERNATIONAL FZE",
        group: 1
    }]

    var links = [{
            source: "Ibrahim Fibres",
            target: "MEGLOBAL INTERNATIONAL FZE",
            type: "missed"
        },
        {
            source: "Bhilosha Ind",
            target: "MEGLOBAL INTERNATIONAL FZE",
            type: "missed"
        },
        {
            source: "ICI Pakistan",
            target: "MEGLOBAL INTERNATIONAL FZE",
            type: "missedffd"
        },
        {
            source: "Reliance Ind",
            target: "MEGLOBAL INTERNATIONAL FZE",
            type: "missed"
        }
    ]

    var width = $("#graph").width(),
        height = $("#graph").height()

    var colors = d3.scaleOrdinal(d3.schemeCategory20c)

    var svg = d3.select("#graph")
        .append("svg")
        .attr("width", width)
        .attr("height", height),
        node, link

    console.log(svg)

    svg.append('defs').append('marker')
        .attrs({
            'id': 'arrowhead',
            'viewBox': '-0 -5 10 10',
            'refX': 37,
            'refY': 0,
            'orient': 'auto',
            'markerWidth': 25,
            'markerHeight': 25,
            'xoverflow': 'visible'
        })
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#999')
        .style('stroke', 'none')

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) {
            return d.id
        }).distance(300).strength(1))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))

    update(links, nodes)

    function update(links, nodes) {
        link = svg.selectAll(".link")
            .data(links)
            .enter()
            .append("line")
            .attr("class", "link")
            .attr('marker-end', 'url(#arrowhead)')

        link.append("div")
            .attr("class", "sc")
            .text(function(d) {
                return d.type
            })

        edgepaths = svg.selectAll(".edgepath")
            .data(links)
            .enter()
            .append('path')
            .attrs({
                'class': 'edgepath',
                'fill-opacity': 0,
                'stroke-opacity': 0,
                'id': function(d, i) {
                    return 'edgepath' + i
                }
            })
            .style("pointer-events", "none")

        edgelabels = svg.selectAll(".edgelabel")
            .data(links)
            .enter()
            .append('text')
            .style("pointer-events", "none")
            .attrs({
                'class': 'edgelabel',
                'id': function(d, i) {
                    return 'edgelabel' + i
                },
                'font-size': 10,
                'fill': '#aaa'
            })

        edgelabels.append('textPath')
            .attr('xlink:href', function(d, i) {
                return '#edgepath' + i
            })
            .style("text-anchor", "middle")
            .style("pointer-events", "none")
            .attr("startOffset", "50%")
            .text(function(d) {
                return d.type
            })


        node = svg.selectAll(".node")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
            )

        node.append("circle")
            .attr("r", 67)
            .style("fill", function(d) {
                return colors(d.group)
            })

        node.append("title")
            .text(function(d) {
                return d.id
            })

        node.append("text")
            .attr("dx", -25)
            .attr("dy", 5)
            .attr("class", "inhtml")
            .text(function(d) {
                return d.id
            })

        simulation
            .nodes(nodes)
            .on("tick", ticked)

        simulation.force("link")
            .links(links)
    }

    function ticked() {
        link
            .attr("x1", function(d) {
                return d.source.x
            })
            .attr("y1", function(d) {
                return d.source.y
            })
            .attr("x2", function(d) {
                return d.target.x
            })
            .attr("y2", function(d) {
                return d.target.y
            })

        node
            .attr("transform", function(d) {
                return "translate(" + d.x + ", " + d.y + ")"
            })

        edgepaths.attr('d', function(d) {
            return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y
        })

        edgelabels.attr('transform', function(d) {
            if (d.target.x < d.source.x) {
                var bbox = this.getBBox()

                rx = bbox.x + bbox.width / 2
                ry = bbox.y + bbox.height / 2
                return 'rotate(180 ' + rx + ' ' + ry + ')'
            } else {
                return 'rotate(0)'
            }
        })
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
    }

    function dragged(d) {
        d.fx = d3.event.x
        d.fy = d3.event.y
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0)
        d.fx = undefined
        d.fy = undefined
    }

    $('#month').data('kendoDatePicker').enable(false);

    $('#radioBtn a').on('click', function() {
        var sel = $(this).data('title');
        var tog = $(this).data('toggle');
        $('#' + tog).prop('value', sel);
        if (sel == "M") {
            $('#year').data('kendoDatePicker').enable(false);
            $('#month').data('kendoDatePicker').enable(true);
        } else if (sel == "Y") {
            $('#year').data('kendoDatePicker').enable(true);
            $('#month').data('kendoDatePicker').enable(false);
        }

        $('a[data-toggle="' + tog + '"]').not('[data-title="' + sel + '"]').removeClass('active').addClass('notActive');
        $('a[data-toggle="' + tog + '"][data-title="' + sel + '"]').removeClass('notActive').addClass('active');
    })

    var dgraph = [{
            "id": 1,
            "bottom": 170,
            "left": 40,
            "transform": -40,
            "bbottom": 76,
            "bleft": 20,
            "linklabel": "UTI Bank $107M",
            "nodelabel": "Relliance Ind",
            "nodelabel2": "IN",
            listdetail: [{
                "bank": "FIBB",
                "product": "TRADE",
                "flow": 8.44,
                "not": 2
            }, {
                "bank": "HBKS",
                "product": "TRADE",
                "flow": 3.40,
                "not": 1
            }, {
                "bank": "HCEB",
                "product": "TRADE",
                "flow": 8.95,
                "not": 2
            }]
        },
        {
            "id": 2,
            "bottom": 300,
            "left": 20,
            "transform": 21,
            "bbottom": 331,
            "bleft": 0,
            "linklabel": "Various Banks $121M SCB",
            "nodelabel": "Ibrahim Fibres",
            "nodelabel2": "Pak",
            listdetail: [{
                "bank": "FIBB",
                "product": "TRADE",
                "flow": 8.44,
                "not": 2
            }, {
                "bank": "HBKS",
                "product": "TRADE",
                "flow": 3.40,
                "not": 1
            }, {
                "bank": "HCEB",
                "product": "TRADE",
                "flow": 8.95,
                "not": 2
            }, {
                "bank": "MCBK",
                "product": "TRADE",
                "flow": 9.27,
                "not": 2
            }, {
                "bank": "MEEB",
                "product": "TRADE",
                "flow": 3.98,
                "not": 2
            }, {
                "bank": "SCBL",
                "product": "TRADE",
                "flow": 2.0,
                "not": 1
            }, {
                "bank": "UNIL",
                "product": "TRADE",
                "flow": 13.18,
                "not": 2
            }]
        },
        {
            "id": 3,
            "bottom": 380,
            "left": 160,
            "transform": -90,
            "bbottom": 490,
            "bleft": 240,
            "linklabel": "$154M SBI",
            "nodelabel": "Bhilosha Ind",
            "nodelabel2": "Ind",
            listdetail: [{
                "bank": "FIBB",
                "product": "TRADE",
                "flow": 8.44,
                "not": 2
            }, {
                "bank": "HBKS",
                "product": "TRADE",
                "flow": 3.40,
                "not": 1
            }, {
                "bank": "HCEB",
                "product": "TRADE",
                "flow": 8.95,
                "not": 2
            }]
        },
        {
            "id": 4,
            "bottom": 360,
            "left": 290,
            "transform": -50,
            "bbottom": 450,
            "bleft": 450,
            "linklabel": "$94M UBL",
            "nodelabel": "ICI Pakistan",
            "nodelabel2": "Pak",
            listdetail: [{
                "bank": "FIBB",
                "product": "TRADE",
                "flow": 8.44,
                "not": 2
            }, {
                "bank": "HBKS",
                "product": "TRADE",
                "flow": 3.40,
                "not": 1
            }]
        },
        {
            "id": 5,
            "bottom": 200,
            "left": 310,
            "transform": 16,
            "bbottom": 160,
            "bleft": 510,
            "linklabel": "$5M",
            "nodelabel": "PWC",
            "nodelabel2": "UK",
            listdetail: [{
                "bank": "FIBB",
                "product": "TRADE",
                "flow": 8.44,
                "not": 2
            }, {
                "bank": "HBKS",
                "product": "TRADE",
                "flow": 3.40,
                "not": 1
            }, {
                "bank": "HCEB",
                "product": "TRADE",
                "flow": 8.95,
                "not": 2
            }]
        }
    ]

    for (var key in dgraph) {
        if (key > 1 && dgraph[key].nodelabel != "PWC") {
            var aleft = '<i class="fa fa-caret-left arrowleft" aria-hidden="true"></i>'
        } else {
            var aleft = '<i class="fa fa-caret-right arrowright" aria-hidden="true"></i>'
        }
        var mynode = '<div align="center" id="jo' + key + '"class="titletext">' +
            '<div style="position: relative" ><span id="linklabel' + key + '"></span>' +
            '<div class="titletextafter"></div>' +
            '<div class="linkdashed" style=""></div>' +
            '</div>' +
            '' + aleft + '' +
            '</div>' +
            '<div class="newtitle" id="bubble' + key + '" >' +
            '<div class="afternewtitle" ><span rel=' + dgraph[key].id + ' id="nodelabel' + key + '"></span></div>' +
            '</div>'

        $("#showing").append(mynode);
        $("#jo" + key + "").css({

            'bottom': dgraph[key].bottom + 'px',
            'left': dgraph[key].left + 'px',
            'transform': 'rotate(' + dgraph[key].transform + 'deg)',

        });
        $("#bubble" + key + "").css({
            'bottom': dgraph[key].bbottom + 'px',
            'left': dgraph[key].bleft + 'px',
        });
        if (dgraph[key].nodelabel == "PWC") {

            $("#bubble" + key + "").css({
                "background-color": "#00bcd4"
            });
            $("#jo" + key + "").find(".linkdashed").css({
                "border": "0px"
            });

            $("#jo" + key + "").css({
                "border": "0px",
                "background-color": "#fff"
            })
        }
        $("#linklabel" + key + "").text(dgraph[key].linklabel);
        $("#nodelabel" + key + "").html(dgraph[key].nodelabel + "<br>" + dgraph[key].nodelabel2);
    }


    $(".afternewtitle").click(function() {

        var bubbletitle = $(this).find("span").attr("rel")

        var data = _.find(dgraph, function(d) {
            return d.id == bubbletitle
        })


        console.log(data["nodelabel"])
        counterpary.datadetailgraph(data.listdetail)

        var arr = bubbletitle.split('<br>')
        var arr1 = arr[0]
        var arr2 = arr[1]
        $(".modal-title").html(data["nodelabel"])
        $('#Modal').modal('show')



    });



}



$(window).load(function() {
    counterpary.generateGraph()
})