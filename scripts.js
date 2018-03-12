var margin = {top: 30, right: 0, bottom: 10, left: 60},
    width = 850,
    height = 850;

var colors = ['#30653a','#7d4f00','#4e597d','#2a616e','#a3301e','#81447f','#005fa9'];

var x = d3.scale.ordinal().rangeBands([0, width]),
    y = d3.scale.ordinal().rangeBands([0, height]),
    z = d3.scale.pow().exponent(0.2).domain([0,100]).range([0,1]);
    c = d3.scale.category10().domain(d3.range(7));

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    //.style("margin-left", -margin.left + "px")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var fishNodes = null,
    fishLinks = null;

d3.csv('matrix-headers.csv', function(data){
  console.log(data);
  fishLinks = data;
  goGate();
});
d3.csv('fisheries-nodes.csv', function(data){
  console.log(data);
  data.forEach(function(each){
    for (key in each){
      if ( each.hasOwnProperty(key) ){
        console.log(each[key]);
        if ( !isNaN(+each[key]) ){
          each[key] = +each[key];
        }
      }
    }
  });
  fishNodes = data;
  goGate();
});

function goGate(){
  if ( fishNodes !== null && fishLinks !== null ){
    go();
  } else {
    return;
  }
}

var newLinks = [],
network = {};
function go(){
  fishLinks.forEach(function(each,i){
    for (key in each){
      if ( each.hasOwnProperty(key) ){
        //console.log(key);
        let match = fishNodes.find(function(obj){ // find the index of the target
          return obj.name === key;
        });
        let index = match.index;
        if (index !== i && each[key] !== "0" ){ // if source and target are not the same
          newLinks.push({
            source: i,
            target: index,
            value: +each[key]
          });
        }
      }
    }
  });
  network.nodes = fishNodes;
  network.links = newLinks;
  render(network);

}

function render(network) {
  console.log(network);
  var matrix = [],
      nodes = network.nodes,
      n = nodes.length;

  // Compute index per node.
  nodes.forEach(function(node, i) {
    node.index = i;
    node.count = 0;
    matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
  });

  // Convert links to matrix; count character occurrences.
  network.links.forEach(function(link) {
    matrix[link.source][link.target].z += link.value;
    matrix[link.target][link.source].z += link.value;
    matrix[link.source][link.source].z += link.value;
    matrix[link.target][link.target].z += link.value;
    nodes[link.source].count += link.value;
    nodes[link.target].count += link.value;
  });

  console.log(matrix);
  // Precompute the orders.
  var orders = {
    name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].index, nodes[b].index); }),
    count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
    cluster: d3.range(n).sort(function(a, b) { return nodes[a].cluster - nodes[b].cluster; })
  };

  // The default sort order.
  x.domain(orders.cluster);

  svg.append("rect")
      .attr("class", "background")
      .attr("width", width)
      .attr("height", height);

  var row = svg.selectAll(".row")
      .data(matrix)
      .enter().append("g")
      .attr("class", "row")
      .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
      .each(row);

  row.append("line")
      .attr("x2", width);

  row.append("text")
      .attr("x", -6)
      .attr("y", x.rangeBand() / 2)
      .attr("dy", ".32em")
      .attr("text-anchor", "end")
      .text(function(d, i) { return nodes[i].name; });

  var column = svg.selectAll(".column")
      .data(matrix)
      .enter().append("g")
      .attr("class", "column")
      .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

  column.append("line")
      .attr("x1", -width);

  column.append("text")
      .attr("x", 6)
      .attr("y", x.rangeBand() / 2)
      .attr("dy", ".32em")
      .attr("text-anchor", "start")
      .text(function(d, i) { return nodes[i].name; });

  function row(row) {
    var cell = d3.select(this).selectAll(".cell")
        .data(row.filter(function(d) { return d.z; }))
        .enter().append("rect")
        .attr("class", "cell")
        .attr("x", function(d) { return x(d.x); })
        .attr("width", x.rangeBand())
        .attr("height", x.rangeBand())
        .style("fill-opacity", function(d) { return z(d.z); })
        .style("fill", function(d) { return nodes[d.x].cluster == nodes[d.y].cluster ? colors[nodes[d.x].cluster - 1] : '#595959'; })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);
  }

  function mouseover(p) {
    d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
    d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
  }

  function mouseout() {
    d3.selectAll("text").classed("active", false);
  }

  d3.select("#order").on("change", function() {
    
    order(this.value);
  });

  function order(value) {
    x.domain(orders[value]);

    var t = svg.transition().duration(2500);

    t.selectAll(".row")
        .delay(function(d, i) { return x(i) * 4; })
        .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
      .selectAll(".cell")
        .delay(function(d) { return x(d.x) * 4; })
        .attr("x", function(d) { return x(d.x); });

    t.selectAll(".column")
        .delay(function(d, i) { return x(i) * 4; })
        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
  }

  
}