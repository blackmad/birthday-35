function listen_on_websocket() {
  var HOST = location.origin.replace(/^http/, 'ws');
  var ws = new WebSocket(HOST);

  $.getJSON('/history', data => {
    data.stations.forEach(s => add_station(s));
    re_init_lines();
    // redraw();
    station_layer.bringToFront();
  });

  ws.onmessage = function(event) {
  console.log('adding station from websocket', event);
    add_station(JSON.parse(event.data));
    re_init_lines();
    // redraw();
  };
}

const stationNotes = {};

function add_station(d) {
  $('#updateInfo').html(`${d['name']} by ${d['adder']} - ${d['note']}`);

  if (!stationNotes[d.id]) {
    stationNotes[d.id] = [];
  }
  stationNotes[d.id].push(d);
  
  if (N_stations[d.id]) {
    return;
  }

  var station = new Station(
    d['lat'],
    d['lng'],
    d['name'],
    d['info'],
    d['riders']
  );
  station.id = d.id;

  station.lines = d['lines'];
  // if (!fix_corrupt_game) {
  //   for (var j = 0; j < station.lines.length; j++) {
  //     if (!is_in_array(station.id, N_lines[station.lines[j]].stations)) {
  //       fix_corrupt_game = true;
  //     }
  //   }
  // }
  // if (!fix_boroughs) {
  //   if (station.borough == 'None') {
  //     fix_boroughs = true;
  //   }
  // }
  // station.drawmaps = true;
  // console.log(station);
  N_stations[station.id] = station;

  if (!d['active']) {
    N_stations[station.id].del();
  }

  // console.log(N_stations);

  station.generate_popup();
}

function re_init_lines() {
  // console.log(N_stations);
  $.getJSON('game-starters/game-start-2016.json', function(data) {
    for (var j = 0; j < data['lines'].length; j++) {
      var d = data['lines'][j];
      var line_id = d['id'];
      // console.log(d)

      N_lines[line_id].stations = d['stations'];
      if (d.name == 'A') { console.log(N_lines[line_id].stations); }
      N_lines[line_id].stations = _.filter(
        N_lines[line_id].stations,
        id => !!N_stations[id]
      );
      if (d.name == 'A') { console.log(N_lines[line_id].stations); }

      N_lines[line_id].draw_map = d['draw_map'];
      N_lines[line_id].draw_map = _.filter(
        N_lines[line_id].draw_map,
        id => !!N_stations[id]
      );
      
      if (d.name == 'A') {
        // console.log(N_lines[line_id]);
      }
    }
    redraw();
  });
}

function redraw() {
  N_stations.forEach(station => {
    if (station) {
      station.drawmaps();
    }
  });
  for (var k = 0; k < N_lines.length; k++) {
    // console.log(N_lines[k]);
    N_lines[k].generate_draw_map();
    N_lines[k].generate_control_points();
  }
  for (var k = 0; k < N_lines.length; k++) {
    console.log(N_lines[k].stations);
    if (N_lines[k].stations.length > 1) {
      console.log('drawing', N_lines[k]);
      N_lines[k].draw();
      generate_route_diagram(N_lines[k]);
    }
  }
  // generate_route_diagram(N_active_line);
}
